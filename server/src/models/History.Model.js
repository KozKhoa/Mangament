import db from "../configs/db.js";
import { GetParentStoryNodeTree } from "./StoryNode.Model.js";

export async function FindAllReadingHistories({
  userId,
  limit = 10,
  page = 1,
  sort = "created_at:desc",
  type = [],
  authorsId = [],
  genres = [],
  star = [],
  view = [],
  fromDate,
  toDate,
}) {
  if (!userId) return { success: false, message: "Missing user id" };

  const histories = await db.readingHistory.findMany({
    where: {
      is_deleted: false,
      ...(fromDate ||
        (toDate && {
          created_at: {
            ...(fromDate && { gte: fromDate }),
            ...(toDate && { lt: toDate }),
          },
        })),
      story: {
        ...(type && { type: { in: type } }),
        ...(genres && { genres: { hasEvery: genres } }),
        ...(authorsId && {
          authors: { some: { author_id: { in: authorsId } } },
        }),
        AND: [
          {
            OR: [...star.map(([min, max]) => ({ star: { gte: min, lte: max } }))],
          },
          {
            OR: [...view.map(([min, max]) => ({ view: { gte: min, lte: max } }))],
          },
        ],
      },
    },
    include: {
      story: {
        select: {
          id: true,
          title: true,
          type: true,
          cover_art: true,
        },
      },
    },
    orderBy: [sort, { created_at: "desc" }, { id: "desc" }],
    take: limit,
    skip: (page - 1) * limit,
  });

  for (const history of histories) {
    history.story_node = await GetParentStoryNodeTree(history.story_node_id);
  }

  return { success: true, data: histories };
}

export const AddReadingHistory = async ({ user_id, story_id, story_node_id }) => {
  try {
    const isExisting = await db.readingHistory.findFirst({ where: { user_id: user_id, story_id: story_id, story_node_id: story_node_id } });
    console.log(isExisting);
    if (isExisting) {
      return { success: true, data: await db.readingHistory.update({ where: { id: isExisting.id }, data: { updated_at: new Date(), is_deleted: false } }) };
    }

    const result = await db.readingHistory.create({
      data: {
        user: {
          connect: {
            id: user_id,
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
