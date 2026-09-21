import { redis } from "../../configs/redis.js";
import { Worker } from "bullmq";
import db from "../../configs/db.js";
import mailService from "../../src/services/mail.service.js";
import redisUtils from "../../src/utils/Redis.js";
import storyQueue from "../queues/story.queue.js";
import * as storyService from "../../src/services/story.service.js";
import { CreateError } from "../../src/utils/ErrorHandle.js";
import { isUUID } from "../../src/utils/Validators.js";

const connection = {
  host: redis.options.host,
  port: redis.options.port,
  password: redis.options.password,
};

const embeddingStoryWorker = new Worker(
  "embedding-story",
  async (job) => {
    const { storyId } = job.data;

    const story = await db.story.findUnique({
      where: { id: storyId },
      select: {
        title: true,
        summary: true,
        genres: { select: { genre: { select: { name: true } } } },
        authors: { select: { author_id: true } },
      },
    });

    const { title, summary, authors } = story;
    const genres = story.genres.map((genre) => genre.genre.name);

    console.log(`Begin embedding story ${title}`);

    const embed = await fetch(`${process.env.ML_SERVICE_URL}/embed`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        text: `${title}. ${summary}. ${genres.join(", ")}. ${authors.map((a) => a.author_id).join(", ")}.`,
      }),
    })
      .then((res) => res.json())
      .catch((err) => {
        console.log(err);
        return null;
      });

    const embedStory = embed.embedding ?? [];

    await db.$executeRaw`
      UPDATE "Story" SET embedding = ${`[${embedStory.join(",")}]`}::vector WHERE id = ${storyId}::uuid
    `;

    console.log("Finish embedding story", title);
  },
  { connection, concurrency: 1 },
);

const hardDeleteStoryWorker = new Worker(
  "hard-delete-story",
  async (job) => {
    const { storyId } = job.data;

    await db.story
      .delete({
        where: { id: storyId }, // Note: fixed variable id to storyId from original code
      })
      .catch(async (error) => {
        const story = await db.story.findUnique({ where: { id: storyId } });
        if (!story) throw new Error("Story not found");

        throw new Error(error);
      });

    console.log("Finish permenant deleted story", storyId);
  },
  { connection, concurrency: 1 },
);

const hardDeleteManyStoriesWorker = new Worker(
  "hard-delete-many-stories",
  async (job) => {
    const { storyIds } = job.data;

    await db.story.deleteMany({ where: { id: { in: storyIds } } });

    console.log("Finish permenant deleted many stories", storyIds);
  },
  { connection, concurrency: 1 },
);

const updateStoryWorker = new Worker(
  "update-story",
  async (job) => {
    const { storyId, editorEmail, title, otherTitles, type, view, summary, posterId, nation, status, genres, coverArt, nextChapterIn, authorIds, children } =
      job.data;

    let success = true;
    let result;

    const story = await db.story.findUnique({
      where: { id: storyId },
      select: {
        id: true,
        title: true,
        cover_art: { select: { id: true, path: true } },
      },
    });

    try {
      result = await db.$transaction(
        async function (tx) {
          const updateStory = await tx.story
            .update({
              where: { id: storyId },
              data: {
                ...(title && { title: title }),
                ...(otherTitles && otherTitles.length > 0 && { other_titles: otherTitles }),
                ...(type && { type: type }),
                ...(view !== undefined && { view: view }),
                ...(summary && { summary: summary }),
                ...(status && { status: status }),
                ...(nextChapterIn && { next_chapter_in: nextChapterIn }),
                ...(nation && nation.length > 0 && { nation: { connect: { name: nation } } }),

                ...(coverArt && {
                  cover_art: coverArt.id
                    ? { connect: { id: coverArt.id } }
                    : {
                        connectOrCreate: {
                          where: { path: coverArt?.path || coverArt?.key || coverArt?.url },
                          create: {
                            path: coverArt?.path || coverArt?.key || coverArt?.url,
                            provider: coverArt?.provider || "r2",
                            mine_type: coverArt?.mine_type || "image/jpeg",
                            width: coverArt?.width ? Number(coverArt.width) : null,
                            height: coverArt?.height ? Number(coverArt.height) : null,
                            size: coverArt?.size ? Number(coverArt.size) : 0,
                          },
                        },
                      },
                }),

                ...(posterId && { poster: { connect: { id: posterId } } }),
              },

              select: { id: true },
              // include: { cover_art: { select: { url: true, width: true, height: true } }, genres: { select: { genre: { select: { name: true } } } } },
            })
            .catch(async (error) => {
              const uniqueTitle = title ? await db.story.findUnique({ where: { title: title } }) : undefined;
              if (uniqueTitle) throw CreateError(400, `'${title}' đã có nguời đăng ký`);

              throw new Error(error);
            });

          if (genres) {
            await tx.story_Genre.deleteMany({ where: { story_id: updateStory.id } });

            const genresId = (await tx.genre.findMany({ where: { name: { in: genres } }, select: { id: true } })).map((genre) => genre.id);

            await tx.story_Genre.createMany({
              data: genresId.map((genreId) => ({
                story_id: updateStory.id,
                genre_id: genreId,
              })),
              skipDuplicates: true,
            });
          }

          if (authorIds) {
            await tx.story_Author.deleteMany({ where: { story_id: updateStory.id } });

            await tx.story_Author.createMany({
              data: authorIds.map((authorId) => ({
                story_id: updateStory.id,
                author_id: authorId,
              })),
              skipDuplicates: true,
            });
          }

          if (children?.delete) {
            // Soft delete story node
            if (children.delete.story_node && children.delete.story_node.length > 0) {
              await tx.storyNode.updateMany({
                where: {
                  id: { in: children.delete.story_node.map((node) => node.id) },
                },
                data: { deleted_status: "soft_deleted" },
              });
            }

            // Soft delete story node content
            if (children.delete?.content && children.delete.content.length > 0) {
              await tx.storyNodeContent.updateMany({
                where: {
                  id: { in: children.delete.content.map((cont) => cont.id) },
                },
                data: { deleted_status: "soft_deleted" },
              });
            }
          }

          if (children?.permanently_delete) {
            if (children.permanently_delete.story_node && children.permanently_delete.story_node.length > 0) {
              await tx.storyNode.deleteMany({
                where: {
                  id: { in: children.permanently_delete.story_node.map((node) => node.id) },
                },
              });
            }

            if (children.permanently_delete.content && children.permanently_delete.content.length > 0) {
              await tx.storyNodeContent.deleteMany({
                where: {
                  id: { in: children.permanently_delete.content.map((cont) => cont.id) },
                },
              });
            }
          }

          if (children?.add) {
            // Add story node
            if (children.add.story_node && children.add.story_node.length > 0) {
              await tx.storyNode.createMany({
                data: children.add.story_node.map((node) => ({
                  id: node.id,
                  title: node.title,
                  story_id: node.story_id,
                  parent_id: node.parent_id,
                  order_index: node.order_index,
                  type: node.type,
                })),
              });
            }

            // Add content
            await tx.storyNodeContent.createMany({
              data: children.add.content.map((cont) => ({
                id: cont.id,
                type: cont.type,
                story_node_id: cont.story_node_id,
                order_index: cont.order_index,
                image_id: cont.image.id,
                content: cont.content,
              })),
            });
          }

          if (children?.edit) {
            // Edit content concurrently using Raw SQL query for high performance
            if (children.edit.content && children.edit.content.length > 0) {
              const contents = children.edit.content;
              const params = [];

              let query = `UPDATE "StoryNodeContent" SET \n  order_index = CASE\n`;
              contents.forEach((c) => {
                params.push(c.id, c.order_index);
                query += `    WHEN id = $${params.length - 1}::uuid THEN $${params.length}::integer\n`;
              });
              query += `    ELSE order_index\n  END`;

              const hasImage = contents.some((c) => c.image?.id || c.image?.path || c.image?.url || c.image?.key);
              if (hasImage) {
                query += `,\n  image_id = CASE\n`;
                contents.forEach((c) => {
                  const imgPath = c.image?.path || c.image?.key || c.image?.url;
                  if (c.image?.id) {
                    params.push(c.id, c.image.id);
                    query += `    WHEN id = $${params.length - 1}::uuid THEN $${params.length}::uuid\n`;
                  } else if (imgPath) {
                    params.push(c.id, imgPath);
                    query += `    WHEN id = $${params.length - 1}::uuid THEN (SELECT id FROM "Image" WHERE path = $${params.length} LIMIT 1)\n`;
                  }
                });
                query += `    ELSE image_id\n  END`;
              }

              const hasContent = contents.some((c) => c.content !== undefined);
              if (hasContent) {
                query += `,\n  content = CASE\n`;
                contents.forEach((c) => {
                  if (c.content !== undefined) {
                    params.push(c.id, c.content);
                    query += `    WHEN id = $${params.length - 1}::uuid THEN $${params.length}::text\n`;
                  }
                });
                query += `    ELSE content\n  END`;
              }

              const idPlaceholders = contents.map((c) => {
                params.push(c.id);
                return `$${params.length}::uuid`;
              });
              query += `\nWHERE id IN (${idPlaceholders.join(", ")});`;

              await tx.$executeRawUnsafe(query, ...params);
            }

            // Edit story node and update its content index concurrently using Raw SQL query
            if (children.edit.story_node && children.edit.story_node.length > 0) {
              const nodes = children.edit.story_node;
              const nodeParams = [];

              let nodeQuery = `UPDATE "StoryNode" SET \n  order_index = CASE\n`;
              nodes.forEach((n) => {
                nodeParams.push(n.id, n.order_index);
                nodeQuery += `    WHEN id = $${nodeParams.length - 1}::uuid THEN $${nodeParams.length}::float\n`;
              });
              nodeQuery += `    ELSE order_index\n  END`;

              const hasTitle = nodes.some((n) => n.title !== undefined);
              if (hasTitle) {
                nodeQuery += `,\n  title = CASE\n`;
                nodes.forEach((n) => {
                  if (n.title !== undefined) {
                    nodeParams.push(n.id, n.title);
                    nodeQuery += `    WHEN id = $${nodeParams.length - 1}::uuid THEN $${nodeParams.length}::text\n`;
                  }
                });
                nodeQuery += `    ELSE title\n  END`;
              }

              const hasType = nodes.some((n) => n.type !== undefined);
              if (hasType) {
                nodeQuery += `,\n  type = CASE\n`;
                nodes.forEach((n) => {
                  if (n.type !== undefined) {
                    nodeParams.push(n.id, n.type);
                    // Let pg infer the type (often it's an enum, so explicit cast can cause issues if not exact)
                    nodeQuery += `    WHEN id = $${nodeParams.length - 1}::uuid THEN $${nodeParams.length}::"StoryNodeType"\n`;
                  }
                });
                nodeQuery += `    ELSE type\n  END`;
              }

              const nodeIdPlaceholders = nodes.map((n) => {
                nodeParams.push(n.id);
                return `$${nodeParams.length}::uuid`;
              });

              nodeQuery += `\nWHERE id IN (${nodeIdPlaceholders.join(", ")});`;

              await tx.$executeRawUnsafe(nodeQuery, ...nodeParams);

              const nodeContents = nodes.flatMap((n) => n.content || []);
              if (nodeContents.length > 0) {
                const contentParams = [];
                let contentQuery = `UPDATE "StoryNodeContent" SET \n  order_index = CASE\n`;
                nodeContents.forEach((c) => {
                  contentParams.push(c.id, c.order_index);
                  contentQuery += `    WHEN id = $${contentParams.length - 1}::uuid THEN $${contentParams.length}::integer\n`;
                });
                contentQuery += `    ELSE order_index\n  END`;

                const hasContentType = nodeContents.some((c) => c.type !== undefined);
                if (hasContentType) {
                  contentQuery += `,\n  type = CASE\n`;
                  nodeContents.forEach((c) => {
                    if (c.type !== undefined) {
                      contentParams.push(c.id, c.type);
                      contentQuery += `    WHEN id = $${contentParams.length - 1}::uuid THEN $${contentParams.length}::"StoryNodeContentType"\n`;
                    }
                  });
                  contentQuery += `    ELSE type\n  END`;
                }

                const hasContent = nodeContents.some((c) => c.content !== undefined);
                if (hasContent) {
                  contentQuery += `,\n  content = CASE\n`;
                  nodeContents.forEach((c) => {
                    if (c.content !== undefined) {
                      contentParams.push(c.id, c.content);
                      contentQuery += `    WHEN id = $${contentParams.length - 1}::uuid THEN $${contentParams.length}::text\n`;
                    }
                  });
                  contentQuery += `    ELSE content\n  END`;
                }

                const contentIdPlaceholders = nodeContents.map((c) => {
                  contentParams.push(c.id);
                  return `$${contentParams.length}::uuid`;
                });
                contentQuery += `\nWHERE id IN (${contentIdPlaceholders.join(", ")});`;

                await tx.$executeRawUnsafe(contentQuery, ...contentParams);
              }
            }
          }

          if (children?.restore) {
            const storyNodes = children.restore.story_node;
            const storyNodeContents = children.restore.content;

            if (storyNodes && storyNodes.length > 0) {
              await tx.storyNode.updateMany({
                where: {
                  id: { in: storyNodes.map((node) => node.id) },
                },
                data: { deleted_status: "not_deleted" },
              });
            }

            if (storyNodeContents && storyNodeContents.length > 0) {
              await tx.storyNodeContent.updateMany({
                where: {
                  id: { in: storyNodeContents.map((content) => content.id) },
                },
                data: { deleted_status: "not_deleted" },
              });
            }
          }

          return updateStory;
        },
        {
          timeout: 10000,
        },
      );

      if ((genres && genres.length > 0) || (authorIds && authorIds.length > 0) || title || summary) {
        await storyService.EmbeddingStory(storyId);
      }
    } catch (error) {
      result = error;
      success = false;
    }

    await redisUtils.stories().incr();
    await redisUtils.stories(storyId).incr();
    await redisUtils.stories(title).incr();

    mailService.sendUpdateStoryStatus(editorEmail, story.title, story.cover_art, success, JSON.stringify(result));

    console.log("Finish update story", story.title);
  },
  { connection, concurrency: 1 },
);

async function resolveNationId(nationId, nationName, nationsCache) {
  // Ưu tiên nation_id nếu có
  if (nationId) {
    if (nationsCache.has(nationId)) return nationsCache.get(nationId);
    const nationById = await db.nation.findUnique({ where: { id: nationId } });
    if (nationById) {
      nationsCache.set(nationId, nationById.id);
      return nationById.id;
    }
  }

  // Fallback: Tìm theo tên nation (unique)
  if (nationName) {
    const key = nationName.toLowerCase().trim();
    if (nationsCache.has(key)) return nationsCache.get(key);
    const nationByName = await db.nation.findFirst({
      where: { name: { equals: nationName.trim(), mode: "insensitive" } },
    });
    if (nationByName) {
      nationsCache.set(key, nationByName.id);
      return nationByName.id;
    }
    nationsCache.set(key, null);
  }

  // Cả hai đều trống hoặc không tìm thấy -> để trống (null)
  return null;
}

async function resolveImageId(imageId, imagesCache) {
  if (!imageId) return null;
  if (imagesCache.has(imageId)) return imagesCache.get(imageId);

  const img = await db.image.findUnique({ where: { id: imageId } });
  if (img) {
    imagesCache.set(imageId, img.id);
    return img.id;
  }
  imagesCache.set(imageId, null);
  return null;
}

async function resolveUserId(userId, usersCache) {
  if (!userId) return null;
  if (usersCache.has(userId)) return usersCache.get(userId);

  if (!isUUID(userId)) {
    usersCache.set(userId, null);
    return null;
  }

  const user = await db.user.findUnique({
    where: { id: userId },
    select: { id: true },
  });

  if (user) {
    usersCache.set(userId, user.id);
    return user.id;
  }

  usersCache.set(userId, null);
  return null;
}

async function resolveGenreIds(genres = [], genresCache) {
  if (!genres || genres.length === 0) return [];
  const resolvedIds = [];

  for (const genreName of genres) {
    if (!genreName || typeof genreName !== "string") continue;
    const cleanName = genreName.trim();
    if (!cleanName) continue;
    const cacheKey = cleanName.toLowerCase();

    if (genresCache.has(cacheKey)) {
      const cachedId = genresCache.get(cacheKey);
      if (cachedId) resolvedIds.push(cachedId);
      continue;
    }

    const genre = await db.genre.findFirst({
      where: {
        name: { equals: cleanName, mode: "insensitive" },
        deleted_status: "not_deleted",
      },
      select: { id: true },
    });

    if (genre) {
      genresCache.set(cacheKey, genre.id);
      resolvedIds.push(genre.id);
    } else {
      genresCache.set(cacheKey, null);
    }
  }

  return [...new Set(resolvedIds)];
}

async function resolveAuthorIds(authorIds = [], authorsCache) {
  if (!authorIds || authorIds.length === 0) return [];
  const resolvedIds = [];

  for (const rawId of authorIds) {
    if (!rawId || typeof rawId !== "string") continue;
    const cleanId = rawId.trim();
    if (!cleanId || !isUUID(cleanId)) continue;

    if (authorsCache.has(cleanId)) {
      const cachedId = authorsCache.get(cleanId);
      if (cachedId) resolvedIds.push(cachedId);
      continue;
    }

    const author = await db.author.findUnique({
      where: { id: cleanId },
      select: { id: true },
    });

    if (author) {
      authorsCache.set(cleanId, author.id);
      resolvedIds.push(author.id);
    } else {
      authorsCache.set(cleanId, null);
    }
  }

  return [...new Set(resolvedIds)];
}

const batchImportStoriesWorker = new Worker(
  "batch-import-stories",
  async (job) => {
    const { rows = [], userId, fileName } = job.data;
    console.log(`[BatchImport] Bắt đầu import ${rows.length} dòng từ file ${fileName || "bảng tính"}`);

    const storiesCache = new Map();
    const nodesCache = new Map();
    const nationsCache = new Map();
    const imagesCache = new Map();
    const usersCache = new Map();
    const genresCache = new Map();
    const authorsCache = new Map();
    const affectedStoryIds = new Set();

    let importedStoriesCount = 0;
    let importedNodesCount = 0;
    let importedContentsCount = 0;

    // Kiểm tra userId có tồn tại trong bảng User không để tránh lỗi Foreign Key Constraint
    const validPosterId = await resolveUserId(userId, usersCache);

    try {
      for (const item of rows) {
        const { story: sData } = item;
        if (!sData || !sData.title) continue;

        const storyTitleKey = sData.title.toLowerCase().trim();
        let story = storiesCache.get(storyTitleKey);

        if (!story) {
          story = await db.story.findUnique({
            where: { title: sData.title },
          });

          if (!story) {
            const resolvedNationId = await resolveNationId(sData.nation_id, sData.nation, nationsCache);
            const resolvedCoverArtId = await resolveImageId(sData.cover_art_id, imagesCache);

            story = await db.story.create({
              data: {
                title: sData.title,
                other_titles: sData.other_titles || [],
                type: sData.type || "manga",
                status: sData.status || "ongoing",
                nation_id: resolvedNationId,
                deleted_status: sData.deleted_status || "not_deleted",
                is_actived: sData.is_actived ?? true,
                summary: sData.summary || null,
                cover_art_id: resolvedCoverArtId,
                poster_id: validPosterId,
              },
            });
            importedStoriesCount++;
          }

          storiesCache.set(storyTitleKey, story);
        }

        affectedStoryIds.add(story.id);

        // Attach genres if provided
        const genresList = sData.genres || [];
        if (genresList.length > 0) {
          const resolvedGenreIds = await resolveGenreIds(genresList, genresCache);
          if (resolvedGenreIds.length > 0) {
            await db.story_Genre.createMany({
              data: resolvedGenreIds.map((genre_id) => ({
                story_id: story.id,
                genre_id,
              })),
              skipDuplicates: true,
            });
          }
        }

        // Attach authors if provided
        const authorIdsList = sData.author_ids || sData.authorIds || [];
        if (authorIdsList.length > 0) {
          const resolvedAuthorIds = await resolveAuthorIds(authorIdsList, authorsCache);
          if (resolvedAuthorIds.length > 0) {
            await db.story_Author.createMany({
              data: resolvedAuthorIds.map((author_id) => ({
                story_id: story.id,
                author_id,
              })),
              skipDuplicates: true,
            });
          }
        }

        // Support dynamic N-level nodes (or fallback to parentNode/childNode)
        const nodes = Array.isArray(item.nodes) ? item.nodes : [item.parentNode, item.childNode].filter(Boolean);

        let currentParentId = null;

        for (let depth = 0; depth < nodes.length; depth++) {
          const nodeData = nodes[depth];
          if (!nodeData || (!nodeData.title && nodeData.order_index === null && !nodeData.content)) {
            continue;
          }

          const nodeOrder = Number(nodeData.order_index ?? 1);
          const nodeKey = `${story.id}_${currentParentId || "root"}_${nodeOrder}_${nodeData.title || ""}`;
          let currentNode = nodesCache.get(nodeKey);

          if (!currentNode) {
            currentNode = await db.storyNode.findFirst({
              where: {
                story_id: story.id,
                parent_id: currentParentId,
                order_index: nodeOrder,
              },
            });

            if (!currentNode) {
              currentNode = await db.storyNode.create({
                data: {
                  story_id: story.id,
                  parent_id: currentParentId,
                  title: nodeData.title || null,
                  type: nodeData.type || (depth === 0 ? "volume" : "chapter"),
                  order_index: nodeOrder,
                  deleted_status: nodeData.deleted_status || "not_deleted",
                  poster_id: validPosterId,
                },
              });

              if (currentParentId) {
                await db.storyNode.update({
                  where: { id: currentParentId },
                  data: { number_of_children: { increment: 1 } },
                });
              } else {
                await db.story.update({
                  where: { id: story.id },
                  data: { number_of_children: { increment: 1 } },
                });
              }
              importedNodesCount++;
            }

            nodesCache.set(nodeKey, currentNode);
          }

          // Nội dung của Node (nếu có)
          if (nodeData.content && (nodeData.content.content || nodeData.content.image_id || nodeData.content.order_index !== null)) {
            const contentImageId = await resolveImageId(nodeData.content.image_id, imagesCache);
            await db.storyNodeContent.create({
              data: {
                story_node_id: currentNode.id,
                order_index: Number(nodeData.content.order_index ?? 1),
                type: nodeData.content.type || (contentImageId ? "image" : "text"),
                content: nodeData.content.content || null,
                image_id: contentImageId,
                deleted_status: nodeData.content.deleted_status || "not_deleted",
              },
            });
            importedContentsCount++;
          }

          // Child node tiếp theo sẽ có parent_id là currentNode.id
          currentParentId = currentNode.id;
        }
      }

      // Refresh redis cache and trigger embedding
      for (const storyId of affectedStoryIds) {
        try {
          await redisUtils.stories(storyId).incr();
          storyQueue.addJob_EmbeddingStory(storyId);
        } catch (err) {
          console.error(`[BatchImport] Error triggering post-import for story ${storyId}:`, err);
        }
      }
      await redisUtils.stories().incr();

      console.log(`[BatchImport] Hoàn tất import: ${importedStoriesCount} truyện mới, ${importedNodesCount} nodes, ${importedContentsCount} contents.`);
    } catch (error) {
      console.error(`[BatchImport] ❌ Lỗi xử lý import file ${fileName}:`, error);
      throw error;
    }
  },
  { connection, concurrency: 1 },
);

batchImportStoriesWorker.on("failed", (job, err) => {
  console.error(`[BatchImport] ❌ Job ${job?.id} thất bại (Lần thử ${job?.attemptsMade}/${job?.opts?.attempts}):`, err?.message || err);
});

export default {
  embeddingStoryWorker,
  hardDeleteStoryWorker,
  hardDeleteManyStoriesWorker,
  updateStoryWorker,
  batchImportStoriesWorker,
};
