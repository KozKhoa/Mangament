import { Worker } from "bullmq";
import db from "../../../configs/db.js";
import mailService from "../../../src/services/mail.service.js";
import redisUtils from "../../../src/utils/Redis.js";
import * as storyService from "../../../src/services/story.service.js";
import { CreateError } from "../../../src/utils/ErrorHandle.js";
import { connection } from "./connection.js";

export const updateStoryWorker = new Worker(
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

          if (children && (children.add || children.edit || children.delete || children.permanently_delete || children.restore)) {
            await storyService.SyncStoryChildren(storyId, tx);
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
    await redisUtils.storyNodes(storyId).incr();
    await redisUtils.storyNodes().incr();

    mailService.sendUpdateStoryStatus(editorEmail, story.title, story.cover_art, success, JSON.stringify(result));

    console.log("Finish update story", story.title);
  },
  { connection, concurrency: 1 },
);
