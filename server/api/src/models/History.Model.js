import db from "../configs/db.js";
import { redis } from "../configs/redis.js";
import redisService from "../services/redis.service.js";
import { CreateError } from "../utils/ErrorHandle.js";
import { GetParentStoryNodeTree } from "./StoryNode.Model.js";

const REDIS_TTL = 60 * 30; // 30 minutes

// Tìm toàn bộ lịch sử đọc của user
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
  const storiesVer = await redisService.stories(storyId).get(); // This is used to update cache when story is updated
  const userVer = await redisService.users(userId).get(); // This is used to update cache when user is updated

  const historiesUserVer = await redisService.histories(userId).get(); // This is used to update cache when user's histories is updated
  const historiesVer = await redisService.histories().get(); // This is used to update cache when histories is updated

  const REDIS_KEY = [
    "FindAllReadingHistories",
    "historiesUserVer=" + historiesUserVer,
    "historiesVer=" + historiesVer,
    "storiesVer=" + storiesVer,
    "userVer=" + userVer,
    "userId=" + userId,
    "storyId=" + storyId,
    "limit=" + limit,
    "page=" + page,
    "sort=" + JSON.stringify(sort),
    "type=" + type,
    "authorsId=" + authorsId,
    "genres=" + genres,
    "star=" + star,
    "view=" + view,
    "fromDate=" + fromDate,
    "toDate=" + toDate,
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
        ...(toDate && { lte: toDate }),
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

  const [histories, totalItems] = await Promise.all([
    db.readingHistory.findMany({
      where: where,
      include: {
        story: {
          select: {
            id: true,
            title: true,
            star: true,
            view: true,
            type: true,
            cover_art: true,
          },
        },
      },
      orderBy: [sort, { updated_at: "desc" }, { id: "desc" }],
      take: limit,
      skip: (page - 1) * limit,
    }),
    db.readingHistory.count({ where: where }),
  ]);

  for (const history of histories) {
    delete history.is_deleted;
    history.story_node = await GetParentStoryNodeTree(history.story_id, history.story_node_id);
  }

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

export async function FindReadingHistory(id) {
  if (!id) throw CreateError(400, "Require id");

  const historiesVer = await redisService.histories(id).get();

  const REDIS_KEY = ["FindReadingHistory", "historiesVer=" + historiesVer, "id=" + id].join(":");

  const cached = await redis.get(REDIS_KEY);
  if (cached) return JSON.parse(cached);

  const history = await db.readingHistory.findUnique({ where: { id: id } });

  if (!history) throw CreateError(404, "History not found");

  history.story_node = await GetParentStoryNodeTree(history.story_id, history.story_node_id);

  const result = { success: true, data: history };

  redis.setex(REDIS_KEY, REDIS_TTL, JSON.stringify(result));

  return result;
}

export async function AddReadingHistory({ userId, storyId, storyNodeId }) {
  if (!userId || !storyId || !storyNodeId) throw CreateError(400, "Require user id, story id and story node id");

  const history = await db.readingHistory
    .create({
      data: {
        user: { connect: { id: userId } },
        story: { connect: { id: storyId } },
        story_node: { connect: { id: storyNodeId } },
      },
    })
    .catch(async (error) => {
      const user = await db.user.findUnique({ where: { id: userId } });
      if (!user) throw CreateError(400, "User not found");

      const story = await db.story.findUnique({ where: { id: storyId } });
      if (!story) throw CreateError(400, "Story not found");

      const storyNode = await db.storyNode.findUnique({ where: { id: storyNodeId } });
      if (!storyNode) throw CreateError(400, "Story node not found");

      throw new Error(error);
    });

  redisService.histories(history.user_id).incr();

  return { success: true, data: history };
}

export async function HardDeleteReadingHistory(id) {
  if (!id) throw CreateError(400, "Require history id");

  const hardRemove = await db.readingHistory.delete({ where: { id: id } });

  redisService.histories(hardRemove.id).incr();
  redisService.histories(hardRemove.user_id).incr();

  return { success: true, message: "Remove permanently" };
}

export async function SoftDeleteReadingHistory(id) {
  if (!id) throw CreateError(400, "Require history id");

  const softRemove = await db.readingHistory.update({
    where: { id: id },
    data: { is_deleted: true },
  });

  redisService.histories(softRemove.id).incr();
  redisService.histories(softRemove.user_id).incr();

  return { success: true, data: softRemove };
}
