import db from "../configs/db.js";

export async function FindAllComments({ userId, storyId, storyNodeId, sort = { updated_at: "desc" }, page = 1, limit = 10 }) {
  if (storyId) {
    const story = await db.story.findFirst({ where: { is_deleted: false, id: storyId } });
    if (!story) throw new Error("Story not found");
  }

  if (userId) {
    const user = await db.user.findFirst({ where: { is_deleted: false, id: userId } });
    if (!user) throw new Error("User not found");
  }

  if (storyNodeId) {
    const storyNode = await db.storyNode.findFirst({ where: { is_deleted: false, id: storyNodeId } });
    if (!storyNode) throw new Error("Story node not found");
  }

  const where = {
    is_deleted: false,

    ...(userId && { user_id: userId }),
    ...(storyId && { story_id: storyId }),
    ...(storyNodeId && { story_node_id: storyNodeId }),
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

  return {
    success: true,
    data: comments,
    pagination: {
      page: page,
      pageSize: limit,
      totalPages: Math.ceil(totalItems / limit),
      totalItems: totalItems,
    },
  };
}

export async function FindComment({ id }) {
  if (!id) throw new Error("Require id");

  const comment = await db.comment.findFirst({ where: { is_deleted: false, id: id } });

  return { success: false, data: comment };
}

export async function AddComment({ userId, storyId, storyNodeId, message }) {
  if (!userId || !storyId) {
    throw new Error("Require user id and story id");
  }

  if (storyId) {
    const story = await db.story.findFirst({ where: { is_deleted: false, id: storyId } });
    if (!story) throw new Error("Story not found");
  }

  if (userId) {
    const user = await db.user.findFirst({ where: { is_deleted: false, id: userId } });
    if (!user) throw new Error("User not found");
  }

  if (storyNodeId) {
    const storyNode = await db.storyNode.findFirst({ where: { is_deleted: false, id: storyNodeId } });
    if (!storyNode) throw new Error("Story node not found");
  }

  const newComment = await db.comment.create({
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
      message: message,
    },
  });

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
