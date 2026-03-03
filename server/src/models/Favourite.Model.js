import db from "../configs/db.js";
import { redis } from "../configs/redis.js";
import { CreateError } from "../utils/ErrorHandle.js";

const REDIS_TTL = 60 * 60; // 60 minutes

// Đây là hàm lấy version redis của FindAllFavouriteStories. Khi user thêm mới story vào fav list của user thì sẽ update version lên
async function getFavVersion(userId) {
  const versionKey = `version:favouriteStories:${userId}`;
  let version = await redis.get(versionKey);

  if (!version) {
    version = 1;
    await redis.set(versionKey, version);
  }

  return version;
}

// Đây là hàm dùng để tăng version cho việc lấy fav list của user
async function incrFavVersion(userId) {
  await redis.incr(`version:favouriteStories:${userId}`);
}

export async function FindAllFavouriteStories({
  limit = 10,
  page = 1,
  userId,
  storyType = [],
  authorsId = [],
  genres = [],
  star = [],
  view = [],
  sort = { created_at: "desc" },
}) {
  const version = await getFavVersion(userId);

  const REDIS_KEY = [
    "FindAllFavouriteStories",
    "v=" + version,
    "page=" + page,
    "limit=" + limit,
    "userId=" + userId,
    "storyType=" + storyType,
    "authorsId=" + authorsId,
    "genres=" + genres,
    "star=" + star,
    "view=" + view,
    "sort=" + JSON.stringify(sort),
  ].join(":");

  const cached = await redis.get(REDIS_KEY);
  if (cached) return JSON.parse(cached);

  const where = {
    user_id: userId,
    story: {
      ...(storyType && { type: { in: storyType } }),
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
  };

  const favourites = await db.favouriteStory.findMany({
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
    orderBy: [sort, { id: "desc" }],
    take: limit,
    skip: (page - 1) * limit,
  });

  const totalItems = await db.favouriteStory.count({ where: where });

  const result = {
    success: true,
    data: favourites,
    pagination: {
      page: page,
      pageSize: favourites.length,
      totalPages: Math.ceil(totalItems / limit),
      totalItems: totalItems,
    },
  };

  await redis.setex(REDIS_KEY, REDIS_TTL, JSON.stringify(result));

  return result;
}

export async function FindFavouriteStory({ id, userId, storyId }) {
  const version = await getFavVersion(userId);

  const REDIS_KEY = ["FindFavouriteStory", "v=" + version, "id=" + id, "userId=" + userId, "storyId=" + storyId].join(":");

  const cached = await redis.get(REDIS_KEY);
  if (cached) return JSON.parse(cached);

  const favourite = await db.favouriteStory.findUnique({
    where: {
      ...(id && { id: id }),
      ...(userId &&
        storyId && {
          user_id_story_id: {
            user_id: userId,
            story_id: storyId,
          },
        }),
    },
  });

  const result = { success: true, data: favourite };

  await redis.setex(REDIS_KEY, REDIS_TTL, JSON.stringify(result));

  return result;
}

export async function AddFavouriteStory({ userId, storyId }) {
  const favourite = await db.favouriteStory
    .create({
      data: {
        user: { connect: { id: userId } },
        story: { connect: { id: storyId } },
      },
    })
    .catch(async (error) => {
      const user = await db.user.findFirst({ where: { is_deleted: false, id: userId } });
      if (!user) throw CreateError(400, "User not found");

      const story = await db.story.findFirst({ where: { is_deleted: false, id: storyId } });
      if (!story) throw CreateError(400, "Story not found");

      throw new Error(error);
    });

  incrFavVersion(userId);

  return { success: true, data: favourite };
}

export async function RemoveFavouriteStory(favouriteId) {
  if (!favouriteId) throw CreateError(400, "Require 'id' for favourite story");

  const removedItem = await db.favouriteStory.delete({ where: { id: favouriteId } });

  incrFavVersion(removedItem.user_id);

  return { success: true, message: "Remove permanently" };
}
