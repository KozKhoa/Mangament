import db from "../configs/db.js";
import { redis } from "../configs/redis.js";
import { CreateError } from "../utils/ErrorHandle.js";

import redisService from "../services/redis.service.js";

import { isUUID } from "../utils/Validators.js";

const REDIS_TTL = 60 * 30; // 30 minutes

export async function FindAllFavouriteStories({
  limit = 10,
  page = 1,
  userId,
  storyId,
  storyType = [],
  authorsId = [],
  genres = [],
  star = [],
  view = [],
  sort = { created_at: "desc" },
}) {
  const storyVer = await redisService.stories(storyId).get(); // This is used to update when a story being updated like it being deleted
  const userVer = await redisService.users(userId).get(); // This is used to update when a user being update like changing their name, avatar,... or they are banned or deleted

  const favouriteUserVer = await redisService.favourites(userId).get(); // This is used to update when user change their fav list like removing or adding one new story into their fav list
  const favouriteVer = await redisService.favourites().get(); // This is used to update when there are any case want to update the whole favourite not care which user its belong to

  const REDIS_KEY = [
    "FindAllFavouriteStories",
    "storyVer=" + storyVer,
    "userVer=" + userVer,
    "favouriteUserVer=" + favouriteUserVer,
    "favouriteVer=" + favouriteVer,
    "page=" + page,
    "limit=" + limit,
    "userId=" + userId,
    "storyId=" + storyId,
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
    user: { id: userId, is_banned: false, is_deleted: false },
    story: {
      is_actived: true,
      is_deleted: false,
      ...(storyId && { id: storyId }),
      ...(storyType && storyType.length > 0 && { type: { in: storyType } }),
      ...(genres &&
        genres.length > 0 && {
          genres: { some: { genre: { in: genres } } },
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

  const [favourites, totalItems] = await Promise.all([
    db.favouriteStory.findMany({
      where: where,
      include: {
        story: {
          select: {
            id: true,
            view: true,
            type: true,
            cover_art: true,
            title: true,
            star: true,
          },
        },
      },
      orderBy: [sort, { id: "desc" }],
      take: limit,
      skip: (page - 1) * limit,
    }),
    db.favouriteStory.count({ where: where }),
  ]);

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

export async function FindFavouriteStory(id) {
  if (!id) throw CreateError(400, "Require 'id' or 'userId' and 'storyId'");

  const favouriteVer = await redisService.favourites(id).get();
  const REDIS_KEY = ["FindFavouriteStory", "favouriteVer=" + favouriteVer, "id=" + id].join(":");

  const cached = await redis.get(REDIS_KEY);
  if (cached) return JSON.parse(cached);

  const favourite = await db.favouriteStory.findFirst({ where: { id: id } });

  const result = { success: true, data: favourite };

  redis.setex(REDIS_KEY, REDIS_TTL, JSON.stringify(result));

  return result;
}

export async function AddFavouriteStory({ userId, storyId }) {
  if (!userId || !storyId) throw CreateError(400, "Require 'userId' and 'storyId'");

  const favourite = await db.favouriteStory
    .create({
      data: {
        user: { connect: { id: userId } },
        story: { connect: { id: storyId } },
      },
    })
    .catch(async (error) => {
      if (!isUUID(userId)) throw CreateError(400, "'userId' must be UUID");
      if (!isUUID(storyId)) throw CreateError(400, "'storyId' must be UUID");

      const user = await db.user.findFirst({ where: { is_deleted: false, id: userId } });
      if (!user) throw CreateError(400, "User not found");

      const story = await db.story.findFirst({ where: { is_deleted: false, id: storyId } });
      if (!story) throw CreateError(400, "Story not found");

      throw new Error(error);
    });

  redisService.favourites(favourite.id).incr();
  redisService.favourites(favourite.user_id).incr();

  return { success: true, data: favourite };
}

export async function RemoveFavouriteStory(favouriteId) {
  if (!favouriteId) throw CreateError(400, "Require 'id' for favourite story");

  const removedItem = await db.favouriteStory.delete({ where: { id: favouriteId } });

  redisService.favourites(removedItem.id).incr();
  redisService.favourites(removedItem.user_id).incr();

  return { success: true, message: "Remove permanently" };
}
