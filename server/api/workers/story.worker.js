import { redis } from "../configs/redis.js";
import { Worker } from "bullmq";
import db from "../configs/db.js";
import mailService from "../src/services/mail.service.js";
import redisUtils from "../src/utils/Redis.js";
import * as storyService from "../src/services/story.service.js";

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
        cover_art: { select: { url: true, key: true } },
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
                  cover_art: { connectOrCreate: { where: { key: coverArt?.key }, create: { url: coverArt?.url, key: coverArt?.key } } },
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

          if (genres && genres.length > 0) {
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

          if (authorIds && authorIds.length > 0) {
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
              data: children.add.content.map((cont, i) => ({
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

              const hasImage = contents.some((c) => c.image?.url);
              if (hasImage) {
                query += `,\n  image_id = CASE\n`;
                contents.forEach((c) => {
                  if (c.image?.url) {
                    params.push(c.id, c.image.url);
                    query += `    WHEN id = $${params.length - 1}::uuid THEN (SELECT id FROM "Image" WHERE url = $${params.length} LIMIT 1)\n`;
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

export default { embeddingStoryWorker, hardDeleteStoryWorker, hardDeleteManyStoriesWorker, updateStoryWorker };
