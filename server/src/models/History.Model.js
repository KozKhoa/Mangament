import db from "../configs/db.js";
import { redis } from "../configs/redis.js";
import { CreateError } from "../utils/ErrorHandle.js";
import { GetParentStoryNodeTree } from "./StoryNode.Model.js";

const REDIS_TTL = 60 * 60; // 60 minutes

// Đây là hàm lấy version redis của FindAllFavouriteStories. Khi user thêm mới story vào fav list của user thì sẽ update version lên
async function getHisVersion(userId) {
  const versionKey = `version:reading-history:${userId}`;
  let version = await redis.get(versionKey);

  if (!version) {
    version = 1;
    await redis.set(versionKey, version);
  }

  return version;
}

// Đây là hàm dùng để tăng version cho việc lấy fav list của user
async function incrHisVersion(userId) {
  await redis.incr(`version:reading-history:${userId}`);
}

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
  const version = await getHisVersion(userId);

  const REDIS_KEY = [
    "FindAllReadingHistories",
    version,
    userId,
    storyId,
    limit,
    page,
    JSON.stringify(sort),
    type,
    authorsId,
    genres,
    star,
    view,
    fromDate,
    toDate,
  ].join(":");

  const cached = await redis.get(REDIS_KEY);
  if (cached) return JSON.parse(cached);

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

  const result = {
    success: true,
    data: histories,
    pagination: {
      page: page,
      pageSize: histories.length,
      totalPages: Math.ceil(totalItems / limit),
      totalItems: totalItems,
    },
  };

  redis.setex(REDIS_KEY, REDIS_TTL, JSON.stringify(result));

  return result;
}

export async function AddReadingHistory({ userId, storyId, storyNodeId, position }) {
  if (!userId || !storyId || !storyNodeId) throw CreateError(400, "Require user id, story id and story node id");

  const history = await db.readingHistory.create({
    data: {
      user: { connect: { id: userId } },
      story: { connect: { id: storyId } },
      story_node: { connect: { id: storyNodeId } },
    },
  });

  incrHisVersion(userId);

  return { success: true, data: history };
}

export async function HardDeleteReadingHistory({ id, userId }) {
  if (!id || !userId) throw new Error("Require history id and userId");

  await db.readingHistory.deleteMany({ where: { id: id, user_id: userId } });

  incrHisVersion(userId);

  return { success: true, message: "Remove permanently" };
}

export async function SoftDeleteReadingHistory({ id, userId }) {
  if (!id && !userId) throw new Error("Require history id and user id");

  const softRemove = await db.readingHistory.update({
    where: { id: id, user_id: userId },
    data: { is_deleted: true },
  });

  incrHisVersion(userId);

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
