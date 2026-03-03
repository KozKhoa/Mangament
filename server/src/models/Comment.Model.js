import db from "../configs/db.js";
import { CreateError } from "../utils/ErrorHandle.js";
import { redis } from "../configs/redis.js";

const REDIS_TTL = 60 * 60; // 60 minutes

// Đây là hàm lấy version redis của comment.
async function getCommentVersion(storyId, storyNodeId) {
  const versionKey = `version:comment:${storyId}:${storyNodeId}`;
  let version = await redis.get(versionKey);

  if (!version) {
    version = 1;
    await redis.set(versionKey, version);
  }

  return version;
}

// Đây là hàm dùng để tăng version cho việc lấy comment list
async function incrCommentVersion(storyId, storyNodeId) {
  await redis.incr(`version:comment:${storyId}:${storyNodeId}`);
}

export async function FindAllComments({ userId, storyId, storyNodeId, sort = { updated_at: "desc" }, page = 1, limit = 10 }) {
  const version = await getCommentVersion(storyId, storyNodeId);

  const REDIS_KEY = [
    "FindAllComments",
    "v=" + version,
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
      user: {
        select: {
          id: true,
          name: true,
          avatar: {
            select: { url: true, width: true, height: true },
          },
        },
      },
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

export async function FindComment({ id }) {
  const REDIS_KEY = ["FindComment", "commentId=" + id].join(":");

  const cached = await redis.get(REDIS_KEY);
  if (cached) return JSON.parse(cached);

  if (!id) throw new Error("Require id");

  const comment = await db.comment.findFirst({ where: { is_deleted: false, id: id } });

  const result = { success: false, data: comment };

  redis.setex(REDIS_KEY, REDIS_TTL, JSON.stringify(result));

  return result;
}

export async function AddComment({ userId, storyId, storyNodeId, title, content }) {
  if (!userId || !storyId) {
    throw CreateError(400, "Require user id and story id");
  }

  if (!title || !content) {
    throw CreateError(400, "Require both title and content");
  }

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
      console.log(error);

      if (storyId) {
        const story = await db.story.findFirst({ where: { is_deleted: false, id: storyId } });
        if (!story) throw CreateError(400, "Story not found");
      }

      if (userId) {
        const user = await db.user.findFirst({ where: { is_deleted: false, id: userId } });
        if (!user) throw CreateError(400, "User not found");
      }

      if (storyNodeId) {
        const storyNode = await db.storyNode.findFirst({ where: { is_deleted: false, id: storyNodeId } });
        if (!storyNode) throw CreateError(400, "Story node not found");
      }

      throw new Error(error);
    });

  delete newComment.is_deleted;

  incrCommentVersion(storyId, storyNodeId);

  return { success: true, data: newComment };
}

export async function UpdateComment(where = { id }, data = { message }) {
  try {
    const updateComment = await db.comment.update({ where: where, data: data });
    return { success: true, data: updateComment };
  } catch (error) {
    if (error.code !== "P2025") console.error("❌ [User.Model.js] Error updating comment: ", error);
    return { success: false, error: error.code };
  }
}

export async function SoftDeleteComment(where = { id }) {
  try {
    const softRemove = await db.comment.update({
      where: where,
      data: {
        is_deleted: true,
      },
    });
    return { success: true, data: softRemove };
  } catch (error) {
    if (error.code !== "P2025") console.error("❌ [User.Model.js] Error soft deleting comment: ", error);
    return { success: false, error: error.code };
  }
}

export async function HardDeleteComment(where = { id }) {
  try {
    const hardRemove = await db.comment.delete({ where: where });
    return { success: true, data: hardRemove };
  } catch (error) {
    if (error.code !== "P2025") console.error("❌ [User.Model.js] Error hard deleting comment: ", error);
    return { success: false, error: error.code };
  }
}

export async function Count(where = { storyNodeId, storyId }) {
  try {
    const res = await db.comment.count({
      where: {
        ...(where.storyNodeId && { story_node_id: where.storyNodeId }),
        ...(where.storyId && { story_id: where.storyId }),
      },
    });

    return { success: true, data: res };
  } catch (error) {
    console.error("❌ [User.Model.js] Error counting comment", error);
    return { success: false, error: error.code };
  }
}
