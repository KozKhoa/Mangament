import db from "../configs/db.js";
import { redis } from "../configs/redis.js";

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
  sort = { updated_at: "desc" },
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

  const REDIS_TTL = 60 * 10; // 10 minutes

  const cached = await redis.get(REDIS_KEY);
  if (cached) return JSON.parse(cached);

  const where = {
    is_deleted: false,
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
    orderBy: [sort, { updated_at: "desc" }, { id: "desc" }],
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
  const REDIS_TTL = 60 * 10; // 10 minutes

  const cached = await redis.get(REDIS_KEY);
  if (cached) return JSON.parse(cached);

  const favourite = await db.favouriteStory.findUnique({
    where: {
      is_deleted: false,
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
  // Is story exist
  const isStoryExist = await db.story.findFirst({ where: { is_deleted: false, id: storyId } });
  if (!isStoryExist) throw new Error("Story not found");

  const favourite = await db.favouriteStory.upsert({
    where: { user_id_story_id: { user_id: userId, story_id: storyId } },
    create: { user: { connect: { id: userId } }, story: { connect: { id: storyId } } },
    update: { is_deleted: false, updated_at: new Date() },
  });

  incrFavVersion(userId);

  return { success: true, data: favourite };
}

export async function HardDeleteFavouriteStory({ id }) {
  if (!id) throw new Error("Require id");

  const hardRemove = await db.favouriteStory.deleteMany({ where: { id: id } });

  incrFavVersion(userId);

  return { success: true, message: "Remove permanently" };
}

export async function SoftDeleteFavouriteStory({ id, userId }) {
  if (!id || !userId) throw new Error("Require favourite id and user id");

  const softRemove = await db.favouriteStory.update({ where: { id: id, user_id: userId }, data: { is_deleted: true } });

  incrFavVersion(userId);

  return { success: true, data: softRemove };
}
