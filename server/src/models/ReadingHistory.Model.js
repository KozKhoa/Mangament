import db from "../configs/db.js";

export const FindReadingHistory = async (
  where = { id, user_id, story_id, story_node_id }
) => {
  try {
    const result = await db.readingHistory.findMany({
      where: { is_deleted: false, ...where },
    });
    return { success: true, data: result };
  } catch (error) {
    console.error("❌ [User.Model.js] Error finding reading history:", error);
    return { success: false, error: error.code };
  }
};

export const AddReadingHistory = async (
  data = {
    user_id,
    story_id,
    story_node_id,
    ...props,
  }
) => {
  try {
    const result = await db.readingHistory.create({
      data: {
        user: {
          connect: {
            id: data.user_id,
          },
        },
        story: {
          connect: {
            id: story_id,
          },
        },
        story_node: {
          connect: {
            id: story_node_id,
          },
        },
        ...props,
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
    console.error(
      "❌ [User.Model.js] Error hard delete reading history: ",
      error
    );
    return { success: false, error: error.code };
  }
};

export const SoftDeleteReadingHistory = async (where = { id }) => {
  try {
    const readingHistory = await FindReadingHistory({ id: where.id });
    if (!readingHistory || !readingHistory.success || !readingHistory.data) {
      return { success: false, data: null };
    }

    const result = await db.readingHistory.update({
      where: where,
      data: { is_deleted: true },
    });
    return { success: true, data: result };
  } catch (error) {
    console.error(
      "❌ [User.Model.js] Error soft delete reading history: ",
      error
    );
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
