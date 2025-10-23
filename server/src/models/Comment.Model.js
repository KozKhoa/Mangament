import { connect } from "http2";
import db from "../configs/db.js";

export async function FindAllComments(
  where = { id, user_id, story_id, story_node_id },
  orderBy,
  take = 1,
  skip = 0
) {
  try {
    const comments = await db.comment.findMany({
      where: { is_deleted: false, ...where },
      ...(orderBy ? { orderBy: orderBy } : { orderBy: { created_at: "desc" } }),
      take: take,
      skip: skip,
      select: {
        id: true,
        user_id: true,
        story_id: true,
        story_node_id: true,
        message: true,
        created_at: true,
      },
    });
    return { success: true, data: comments };
  } catch (error) {
    console.error("❌ [User.Model.js] Error finding comment", error);
    return { success: false, error: error.code };
  }
}

export async function AddComment(
  data = { user_id, story_id, story_node_id, message }
) {
  try {
    if (
      !data.story_id ||
      !data.user_id ||
      !data.message ||
      !data.message.length === 0
    )
      return { success: false, data: null };

    const newComment = await db.comment.create({
      data: {
        user: {
          connect: {
            id: data.user_id,
          },
        },
        story: {
          connect: {
            id: data.story_id,
          },
        },
        ...(data.story_node_id && {
          story_node: {
            connect: {
              id: data.story_node_id,
            },
          },
        }),
        message: data.message,
      },
    });
    return { success: true, data: newComment };
  } catch (error) {
    console.error("❌ [User.Model.js] Error adding new comment: ", error);
    return { success: false, error: error.code };
  }
}

export async function UpdateComment(where = { id }, data = { message }) {
  try {
    const updateComment = await db.comment.update({ where: where, data: data });
    return { success: true, data: updateComment };
  } catch (error) {
    if (error.code !== "P2025")
      console.error("❌ [User.Model.js] Error updating comment: ", error);
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
    if (error.code !== "P2025")
      console.error("❌ [User.Model.js] Error soft deleting comment: ", error);
    return { success: false, error: error.code };
  }
}

export async function HardDeleteComment(where = { id }) {
  try {
    const hardRemove = await db.comment.delete({ where: where });
    return { success: true, data: hardRemove };
  } catch (error) {
    if (error.code !== "P2025")
      console.error("❌ [User.Model.js] Error hard deleting comment: ", error);
    return { success: false, error: error.code };
  }
}
