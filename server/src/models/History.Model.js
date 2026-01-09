import db from "../configs/db.js";
import { GetParentStoryNodeTree } from "./StoryNode.Model.js";

export async function FindAllReadingHistories({
  userId,
  storyId,
  limit = 10,
  page = 1,
  sort = { updated_at: "desc" },
  type = [],
  authorsId = [],
  genres = [],
  star = [],
  view = [],
  fromDate,
  toDate,
}) {
  if (!userId) return { success: false, message: "Missing user id" };

  if (storyId) {
    const story = await db.story.findFirst({ where: { is_deleted: false, id: storyId } });
    if (!story) throw new Error("Story not found");
  }

  const where = {
    is_deleted: false,

    user_id: userId,

    ...(storyId && { story_id: storyId }),

    ...(fromDate ||
      (toDate && {
        updated_at: {
          ...(fromDate && { gte: fromDate }),
          ...(toDate && { lt: toDate }),
        },
      })),

    story: {
      ...(type && type.length > 0 && { type: { in: type } }),
      ...(genres &&
        genres.length > 0 && {
          genres: {
            some: {
              genre: {
                in: genres,
              },
            },
          },
        }),
      ...(authorsId &&
        authorsId.length > 0 && {
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
  };

  const histories = await db.readingHistory.findMany({
    where: where,
    include: {
      story: {
        select: {
          id: true,
          title: true,
          star: true,
          view: true,
          type: true,
          cover_art: {
            select: {
              url: true,
              width: true,
              height: true,
            },
          },
        },
      },
    },
    orderBy: [sort, { updated_at: "desc" }, { id: "desc" }],
    take: limit,
    skip: (page - 1) * limit,
  });

  for (const history of histories) {
    delete history.is_deleted;
    history.story_node = await GetParentStoryNodeTree(history.story_node_id);
  }

  const totalItems = await db.readingHistory.count({ where: where });

  return {
    success: true,
    data: histories,
    pagination: {
      page: page,
      pageSize: limit,
      totalPages: Math.floor(totalItems / limit),
      totalItems: totalItems,
    },
  };
}

export async function FindReadingHistory({ id, userId, storyId, storyNodeId }) {
  if (!(id || (userId && storyId && storyNodeId))) {
    throw new Error("Require id or (user id, story id and story node id)");
  }

  if (userId) {
    const user = await db.user.findFirst({ where: { is_deleted: false, id: userId } });
    if (!user) throw new Error("User not found");
  }

  if (storyId) {
    const story = await db.story.findFirst({ where: { is_deleted: false, id: storyId } });
    if (!story) throw new Error("Story not found");
  }

  if (storyNodeId) {
    const storyNode = await db.storyNode.findFirst({ where: { is_deleted: false, id: storyNodeId } });
    if (!storyNode) throw new Error("Story node not found");
  }

  const history = await db.readingHistory.findUnique({
    where: {
      is_deleted: false,
      ...(id && { id: id }),
      ...(userId &&
        storyId &&
        storyNodeId && {
          user_id_story_id_story_node_id: {
            user_id: userId,
            story_id: storyId,
            story_node_id: storyNodeId,
          },
        }),
    },
  });

  history.story_node = await GetParentStoryNodeTree(history.story_node_id);

  delete history.is_deleted;

  return { success: true, data: history };
}

export async function AddReadingHistory({ userId, storyId, storyNodeId, position }) {
  // Check if story
  const story = await db.story.findUnique({ where: { id: storyId } });
  if (!story) return { success: false, message: "Story does not exist" };

  // Check if story node exist
  const storyNode = await db.storyNode.findUnique({ where: { id: storyNodeId } });
  if (!storyNode) return { success: false, message: "Story node does not exist" };

  // Update status if this history exist
  const history = await db.readingHistory.findUnique({
    where: {
      user_id_story_id_story_node_id: {
        user_id: userId,
        story_id: storyId,
        story_node_id: storyNodeId,
      },
    },
  });
  if (history) {
    const update = await db.readingHistory.update({ where: { id: history.id }, data: { is_deleted: false, updated_at: new Date() } });
    return { success: true, data: update };
  }

  const newHistory = await db.readingHistory.create({
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
      story_node: {
        connect: {
          id: storyNodeId,
        },
      },
    },
  });

  return { success: true, data: newHistory };
}

export const HardDeleteReadingHistory = async (where = { id }) => {
  try {
    const result = await db.readingHistory.delete({ where: where });
    return { success: true, data: result };
  } catch (error) {
    console.error("❌ [User.Model.js] Error hard delete reading history: ", error);
    return { success: false, error: error.code };
  }
};

export async function SoftDeleteReadingHistory({ id }) {
  try {
    const readingHistory = await db.readingHistory.findUnique({ where: { id: id } });
    if (!readingHistory) return { success: false, message: "Cannot find reading history" };

    const result = await db.readingHistory.update({
      where: { id: id },
      data: { is_deleted: true },
    });
    return { success: true, data: result };
  } catch (error) {
    console.error("❌ [User.Model.js] Error soft delete reading history: ", error);
    return { success: false, error: error.code };
  }
}

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
