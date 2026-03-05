import db from "../configs/db.js";
import { CreateError } from "../utils/ErrorHandle.js";
import { redis } from "../configs/redis.js";
import redisService from "../services/redis.service.js";
import { isUUID } from "../utils/Validators.js";

const REDIS_TTL = 60 * 15; // 15 minutes

export async function FindAllComments({ userId, storyId, storyNodeId, sort = { updated_at: "desc" }, page = 1, limit = 10 }) {
  const storiesVer = await redisService.stories(storyId).get(); // This use to update when a story being updated like it being deleted
  const storyNodeVer = await redisService.storyNodes(storyNodeId).get(); // This use to update when a story node being updated like it being deleted
  const userVer = await redisService.users(userId).get(); // This use to update when a user being updated like it being deleted
  const commentStoryVer = await redisService.comments(storyId).get(); // This use to update when a comment of a story being update like when somebody add new comment
  const commentVer = await redisService.comments().get(); // This use update when there are any case want to update the whole comment not care which story its belong to

  const REDIS_KEY = [
    "FindAllComments",
    "storiesVer=" + storiesVer,
    "storyNodeVer=" + storyNodeVer,
    "commentStoryVer=" + commentStoryVer,
    "userVer=" + userVer,
    "commentVer=" + commentVer,
    "userId=" + userId,
    "storyId=" + storyId,
    "storyNodeId=" + storyNodeId,
    "page=" + page,
    "limit=" + limit,
    "sort=" + JSON.stringify(sort),
  ].join(":");

  const cached = await redis.get(REDIS_KEY);
  if (cached) return JSON.parse(cached);

  const where = {
    is_deleted: false,

    user_id: userId,
    story_id: storyId,
    story_node_id: storyNodeId,
  };

  const comments = await db.comment.findMany({
    where: where,
    include: {
      user: { select: { id: true, name: true, avatar: true } },
    },
    orderBy: [sort, { id: "asc" }],
    take: limit,
    skip: (page - 1) * limit,
  });

  const totalItems = await db.comment.count({ where: where });

  const result = {
    success: true,
    data: comments,
    pagination: {
      page: page,
      pageSize: comments.length,
      totalPages: Math.ceil(totalItems / limit),
      totalItems: totalItems,
    },
  };

  redis.setex(REDIS_KEY, REDIS_TTL, JSON.stringify(result));

  return result;
}

export async function FindComment(id) {
  const commentVer = await redisService.comments(id).get();

  const REDIS_KEY = ["FindComment", "commentVer=" + commentVer, "id=" + id].join(":");

  const cached = await redis.get(REDIS_KEY);
  if (cached) return JSON.parse(cached);

  // This func do not need to cached because it is hardly called
  if (!id) throw CreateError(400, "Require 'id'");

  const comment = await db.comment.findFirst({
    where: { is_deleted: false, id: id },
    include: { user: { select: { id: true, name: true, avatar: true } } },
  });

  if (!comment) throw CreateError(404, "Comment not found");

  return { success: true, data: comment };
}

export async function AddComment({ userId, storyId, storyNodeId, title, content }) {
  if (!userId || !storyId) throw CreateError(400, "Require user id and story id");

  if (!title || !content) throw CreateError(400, "Require both title and content");

  const newComment = await db.comment
    .create({
      data: {
        user: {
          connect: {
            id: userId,
          },
        },
        story: {
          connect: {
            id: storyId,
          },
        },
        ...(storyNodeId && {
          story_node: {
            connect: {
              id: storyNodeId,
            },
          },
        }),
        title: title,
        content: content,
      },

      include: {
        user: {
          select: {
            id: true,
            name: true,
            avatar: { select: { url: true, height: true, width: true } },
          },
        },
      },
    })
    .catch(async (error) => {
      // If there are any error occur, that could be wrong storyId, userId or storyNodeId

      if (storyId) {
        if (!isUUID(storyId)) throw CreateError(400, "'storyId' must be UUID");
        const story = await db.story.findFirst({ where: { is_deleted: false, id: storyId } });
        if (!story) throw CreateError(400, "Story not found");
      }

      if (userId) {
        if (!isUUID(userId)) throw CreateError(400, "'userId' must be UUID");
        const user = await db.user.findFirst({ where: { is_deleted: false, id: userId } });
        if (!user) throw CreateError(400, "User not found");
      }

      if (storyNodeId) {
        if (!isUUID(storyNodeId)) throw CreateError(400, "'storyNodeId' must be UUID");
        const storyNode = await db.storyNode.findFirst({ where: { is_deleted: false, id: storyNodeId } });
        if (!storyNode) throw CreateError(400, "Story node not found");
      }

      throw new Error(error);
    });

  delete newComment.is_deleted;

  redisService.comments(newComment.story_id).incr(); // This will remove the cached for list of all comment belonging to story

  return { success: true, data: newComment };
}

export async function UpdateComment(id, { title, content }) {
  if (!id) throw CreateError(400, "Require 'id'");

  const update = await db.comment
    .update({
      where: { id: id },
      data: { title: title, content: content },
    })
    .catch(async (error) => {
      if (!isUUID(id)) throw CreateError(400, "'id' must be UUID");
      const comment = await db.comment.findFirst({ where: { is_deleted: false, id: id } });
      if (!comment) throw CreateError(400, "Comment not found");

      throw new Error(error);
    });

  redisService.comments(update.story_id).incr(); // This will remove the cached for list of all comment belonging to story

  return { success: true, data: update };
}

export async function SoftDeleteComment(id) {
  if (!id) throw CreateError(400, "Require 'id'");

  const softRemove = await db.comment
    .update({
      where: { id: id },
      data: { is_deleted: true },
    })
    .catch(async (error) => {
      if (!isUUID(id)) throw CreateError(400, "'id' must be UUID");
      const comment = await db.comment.findFirst({ where: { id: id } });
      if (!comment) throw CreateError(400, "Comment not found");

      throw new Error(error);
    });

  redisService.comments(softRemove.story_id).incr(); // This will remove the cached for list of all comment belonging to story

  return { success: true, data: softRemove };
}

export async function HardDeleteComment(id) {
  if (!id) throw CreateError(400, "Require 'id'");

  const hardRemove = await db.comment
    .delete({
      where: { id: id },
    })
    .catch(async (error) => {
      if (!isUUID(id)) throw CreateError(400, "'id' must be UUID");
      const comment = await db.comment.findFirst({ where: { id: id } });
      if (!comment) throw CreateError(400, "Comment not found");

      throw new Error(error);
    });

  redisService.comments(hardRemove.story_id).incr(); // This will remove the cached for list of all comment belonging to story

  return { success: true, data: hardRemove };
}
