import db from "../configs/db.js";
import { CreateError } from "../utils/ErrorHandle.js";
import { redis } from "../configs/redis.js";
import redisUtils from "../utils/Redis.js";

import { isUUID } from "../utils/Validators.js";

const REDIS_TTL = 60 * 15; // 15 minutes

export async function FindAllComments({ userId, storyId, storyNodeId, sort = { updated_at: "desc" }, page = 1, limit = 10 }) {
  const storiesVer = await redisUtils.stories(storyId).get(); // This use to update when a story being updated like it being deleted
  const storyNodeVer = await redisUtils.storyNodes(storyNodeId).get(); // This use to update when a story node being updated like it being deleted

  const commentUserVer = await redisUtils.comments(userId).get(); // This use to update when a comment of a user being update like when somebody add new comment
  const commentStoryVer = await redisUtils.comments(storyId).get(); // This use to update when a comment of a story being update like when somebody add new comment
  const commentStoryNodeVer = await redisUtils.comments(storyNodeId).get(); // This use to update when a comment of a story node being update like when somebody add new comment
  const commentVer = await redisUtils.comments().get(); // This use update when there are any case want to update the whole comment not care which story its belong to

  const REDIS_KEY = [
    "FindAllComments",
    "storiesVer=" + storiesVer,
    "storyNodeVer=" + storyNodeVer,
    "commentUserVer=" + commentUserVer,
    "commentStoryVer=" + commentStoryVer,
    "commentStoryNodeVer=" + commentStoryNodeVer,
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
    deleted_status: "not_deleted",

    user_id: userId,
    story_id: storyId,
    story_node_id: storyNodeId,
  };

  const [comments, totalItems] = await Promise.all([
    db.comment.findMany({
      where: where,
      include: {
        user: { select: { id: true, name: true, avatar: true } },
      },
      orderBy: [sort, { id: "asc" }],
      take: limit,
      skip: (page - 1) * limit,
    }),
    db.comment.count({ where: where }),
  ]);

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
  if (!id) throw CreateError(400, "Require 'id'");

  if (!isUUID(id)) throw CreateError("'id' must be uuid");

  const commentVer = await redisUtils.comments(id).get();

  const REDIS_KEY = ["FindComment", "commentVer=" + commentVer, "id=" + id].join(":");

  const cached = await redis.get(REDIS_KEY);
  if (cached) return JSON.parse(cached);

  // This func do not need to cached because it is hardly called

  const comment = await db.comment.findFirst({
    where: { deleted_status: "not_deleted", id: id },
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
        const story = await db.story.findFirst({ where: { deleted_status: "not_deleted", id: storyId } });
        if (!story) throw CreateError(400, "Story not found");
      }

      if (userId) {
        if (!isUUID(userId)) throw CreateError(400, "'userId' must be UUID");
        const user = await db.user.findFirst({ where: { deleted_status: "not_deleted", id: userId } });
        if (!user) throw CreateError(400, "User not found");
      }

      if (storyNodeId) {
        if (!isUUID(storyNodeId)) throw CreateError(400, "'storyNodeId' must be UUID");
        const storyNode = await db.storyNode.findFirst({ where: { deleted_status: "not_deleted", id: storyNodeId } });
        if (!storyNode) throw CreateError(400, "Story node not found");
      }

      throw new Error(error);
    });

  redisUtils.comments(newComment.story_id).incr(); // This will remove the cached for list of all comment belonging to story
  redisUtils.comments(newComment.user_id).incr(); // This will remove the cached for list of all comment belonging to story

  if (newComment.story_node_id) {
    redisUtils.comments(newComment.story_node_id).incr(); // This will remove the cached for list of all comment belonging to story
  } else {
    redisUtils.comments(newComment.story_id).incr(); // This will remove the cached for list of all comment belonging to story
  }

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
      const comment = await db.comment.findFirst({ where: { deleted_status: "not_deleted", id: id } });
      if (!comment) throw CreateError(400, "Comment not found");

      throw new Error(error);
    });

  redisUtils.comments(update.id).incr();

  if (update.story_node_id) {
    redisUtils.comments(update.story_node_id).incr();
  } else {
    redisUtils.comments(update.story_id).incr();
  }

  return { success: true, data: update };
}

export async function SoftDeleteComment(id) {
  if (!id) throw CreateError(400, "Require 'id'");

  if (!isUUID(id)) throw CreateError(400, "'id' must be uuid");

  const softRemove = await db.comment
    .update({
      where: { id: id },
      data: { deleted_status: "soft_deleted" },
    })
    .catch(async (error) => {
      const comment = await db.comment.findFirst({ where: { id: id } });
      if (!comment) throw CreateError(400, "Comment not found");

      throw new Error(error);
    });

  redisUtils.comments(softRemove.id).incr();

  if (softRemove.story_node_id) {
    redisUtils.comments(softRemove.story_node_id).incr();
  } else {
    redisUtils.comments(softRemove.story_id).incr();
  }

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

  redisUtils.comments(hardRemove.id).incr();

  if (hardRemove.story_node_id) {
    redisUtils.comments(hardRemove.story_node_id).incr();
  } else {
    redisUtils.comments(hardRemove.story_id).incr();
  }

  return { success: true, data: hardRemove };
}
