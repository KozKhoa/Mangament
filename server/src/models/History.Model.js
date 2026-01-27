import db from "../configs/db.js";
import { CreateError } from "../utils/ErrorHandle.js";
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

  const where = {
    is_deleted: false,

    user_id: userId,

    ...(storyId && { story_id: storyId }),

    ...((fromDate || toDate) && {
      updated_at: {
        ...(fromDate && { gte: fromDate }),
        ...(toDate && { lt: toDate }),
      },
    }),

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
    history.story_node = await GetParentStoryNodeTree(history.story_id, history.story_node_id);
  }

  const totalItems = await db.readingHistory.count({ where: where });

  return {
    success: true,
    data: histories,
    pagination: {
      page: page,
      pageSize: histories.length,
      totalPages: Math.ceil(totalItems / limit),
      totalItems: totalItems,
    },
  };
}

export async function FindReadingHistory({ id, userId, storyId, storyNodeId }) {
  if (!(id || (userId && storyId && storyNodeId))) {
    throw new Error("Require id or (user id, story id and story node id)");
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

  history.story_node = await GetParentStoryNodeTree(history.story_id, history.story_node_id);

  delete history.is_deleted;

  return { success: true, data: history };
}

export async function AddReadingHistory({ userId, storyId, storyNodeId, position }) {
  if (!userId || !storyId || !storyNodeId) throw CreateError(400, "Require user id, story id and story node id");

  const history = await db.readingHistory.upsert({
    where: {
      user_id_story_id_story_node_id: {
        user_id: userId,
        story_id: storyId,
        story_node_id: storyNodeId,
      },
    },
    update: {
      is_deleted: false,
      updated_at: new Date(),
    },
    create: {
      user: { connect: { id: userId } },
      story: { connect: { id: storyId } },
      story_node: { connect: { id: storyNodeId } },
    },
  });

  return { success: true, data: history };
}

export async function HardDeleteReadingHistory({ id, userId }) {
  if (!id || !userId) throw new Error("Require history id and userId");

  const hardRemove = await db.readingHistory.deleteMany({ where: { id: id, user_id: userId } });

  return { success: true, message: "Remove permanently" };
}

export async function SoftDeleteReadingHistory({ id, userId }) {
  if (!id && !userId) throw new Error("Require history id and user id");

  const softRemove = await db.readingHistory.update({
    where: { id: id, user_id: userId },
    data: { is_deleted: true },
  });

  return { success: true, data: softRemove };
}

export async function CountHistories({ isDeleted }) {
  const count = await db.readingHistory.count({
    where: {
      ...(isDeleted !== undefined && typeof isDeleted === "boolean" && { is_deleted: isDeleted }),
    },
  });
  return { success: true, data: count };
}
