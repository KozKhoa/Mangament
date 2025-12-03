import db from "../configs/db.js";
import { GetParentStoryNodeTree } from "./StoryNode.Model.js";

export const FindAllReadingHistories = async (where = { id, user_id, story_id, story_node_id }, take = 1, skip = 0, orderBy) => {
  try {
    const readingHistory = await db.readingHistory.findMany({
      where: { is_deleted: false, ...where },
      take: take,
      skip: skip,
      ...(orderBy ? { orderBy: orderBy } : { orderBy: { created_at: "desc" } }),
      select: {
        id: true,
        user_id: true,
        created_at: true,
        story_node_id: true,
        story: {
          select: {
            id: true,
            title: true,
            type: true,
            cover_art: {
              select: { url: true, width: true, height: true },
            },
          },
        },
      },
    });

    for (const history of readingHistory) {
      history.story_node = await GetParentStoryNodeTree(history.story_node_id);
    }

    return { success: true, data: readingHistory };
  } catch (error) {
    console.error("❌ [User.Model.js] Error finding all reading histories:", error);
    return { success: false, error: error.code };
  }
};

export const AddReadingHistory = async (
  data = {
    user_id,
    story_id,
    story_node_id,
  }
) => {
  try {
    const isExisting = await db.readingHistory.findFirst({ where: { user_id: data.user_id, story_id: data.story_id, story_node_id: data.story_node_id } });
    if (isExisting) {
      return { success: true, data: await db.readingHistory.update({ where: { id: isExisting.id }, data: { updated_at: new Date(), is_deleted: false } }) };
    }

    const result = await db.readingHistory.create({
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
        story_node: {
          connect: {
            id: data.story_node_id,
          },
        },
      },
    });
    return { success: true, data: result };
  } catch (error) {
    console.error("❌ [User.Model.js] Error adding reading history:", error);
    return { success: false, error: error.code };
  }
};

export const HardDeleteReadingHistory = async (where = { id }) => {
  try {
    const result = await db.readingHistory.delete({ where: where });
    return { success: true, data: result };
  } catch (error) {
    console.error("❌ [User.Model.js] Error hard delete reading history: ", error);
    return { success: false, error: error.code };
  }
};

export const SoftDeleteReadingHistory = async (where = { id }) => {
  try {
    const readingHistory = await FindAllReadingHistories({ id: where.id });
    if (!readingHistory || !readingHistory.success || !readingHistory.data) {
      return { success: false, data: null };
    }

    const result = await db.readingHistory.update({
      where: where,
      data: { is_deleted: true },
    });
    return { success: true, data: result };
  } catch (error) {
    console.error("❌ [User.Model.js] Error soft delete reading history: ", error);
    return { success: false, error: error.code };
  }
};

export const UpdateReadingHistory = async (where = { id }, data = {}) => {
  try {
    const readingHistory = await FindReadingHistory({ id: where.id });
    if (!readingHistory || !readingHistory.success || !readingHistory.data) {
      return { success: false, data: null };
    }

    const result = await db.readingHistory.update({
      where: where,
      data: data,
    });
    return { success: true, data: result };
  } catch (error) {
    console.error("❌ [User.Model.js] Error updating reading history: ", error);
    return { success: false, error: error.code };
  }
};
