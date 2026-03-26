import db from "../configs/db.js";
import { CreateError } from "../utils/ErrorHandle.js";

import { redis } from "../configs/redis.js";

import redisUtils from "../utils/Redis.js";

const REDIS_TTL = 60 * 30; // 30 minutes

export async function FindAllRatings({ storyId, userId, star = [[0, 6]], sort = { updated_at: "desc" }, page = 1, limit = 10 }) {
  const storyVer = await redisUtils.stories(storyId).get();

  const ratingStoryVer = await redisUtils.ratings(storyId).get();
  const ratingUserVer = await redisUtils.ratings().get();

  const REDIS_KEY = [
    "FindAllRatings",
    "storyVer=" + storyVer,
    "ratingStoryVer=" + ratingStoryVer,
    "ratingUserVer=" + ratingUserVer,
    "storyId=" + storyId,
    "userId=" + userId,
    "star=" + star,
    "sort=" + JSON.stringify(sort),
    "page=" + page,
    "limit=" + limit,
  ].join(":");

  const cached = await redis.get(REDIS_KEY);
  if (cached) return JSON.parse(cached);

  const where = {
    is_deleted: false,
    ...(storyId && { story_id: storyId }),
    ...(userId && { user_id: userId }),

    OR: [...star.map(([min, max]) => ({ star: { gte: min, lte: max } }))],
  };

  const [ratings, totalItems] = await Promise.all([
    db.rating.findMany({
      where: where,

      include: {
        user: {
          select: {
            id: true,
            name: true,
            avatar: true,
          },
        },
      },

      orderBy: [sort, { id: "asc" }],
      take: limit,
      skip: (page - 1) * limit,
    }),
    db.rating.count({ where: where }),
  ]);

  const result = {
    success: true,
    data: ratings,
    pagination: {
      page: page,
      pageSize: ratings.length,
      totalPages: Math.ceil(totalItems / limit),
      totalItems: totalItems,
    },
  };

  redis.setex(REDIS_KEY, REDIS_TTL, JSON.stringify(result));

  return result;
}

export async function FindRating(id) {
  if (!id) throw CreateError(400, "Require id");

  const ratingVer = await redisUtils.ratings(id).get();

  const REDIS_KEY = ["FindRating", "ratingVer=" + ratingVer, "id=" + id].join(":");

  const cached = await redis.get(REDIS_KEY);
  if (cached) return JSON.parse(cached);

  const rating = await db.rating.findFirst({
    where: { is_deleted: false, id: id },
    include: {
      user: {
        select: { id: true, name: true, avatar: true },
      },
    },
  });

  const result = { success: true, data: rating };

  redis.setex(REDIS_KEY, REDIS_TTL, JSON.stringify(result));

  return result;
}

export async function AddRatings({ userId, storyId, star, title, content }) {
  if (!userId || !storyId) {
    throw CreateError(400, "Require both story id and user id");
  }

  if ((star !== 0 && !star) || !title || !content) {
    throw CreateError(400, "Require star, title and content");
  }

  if (typeof star !== "number" || star < 1 || star > 5) {
    throw CreateError(400, "star must be a number between 1 and 5");
  }

  const story = await db.story.findFirst({ where: { id: storyId, is_deleted: false } });
  if (!story) throw CreateError(400, "Story not found");

  return db.$transaction(async (db) => {
    const newRating = await db.rating
      .create({
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
          star: star,
          title: title,
          content: content,
        },

        include: { user: { select: { id: true, name: true, avatar: { select: { url: true, height: true, width: true } } } } },
      })
      .catch(async (error) => {
        const oldRating = await db.rating.findUnique({ where: { user_id_story_id: { story_id: storyId, user_id: userId } } });
        if (oldRating) throw CreateError(400, "Rating already exist");

        const user = await db.user.findFirst({ where: { id: userId, is_deleted: false } });
        if (!user) throw CreateError(400, "User not found");

        throw new Error(error);
      });

    // Update star for story
    const newStar = (story.star * story.rating_count + star) / (story.rating_count + 1);
    await db.story.update({
      where: { id: storyId },
      data: {
        star: newStar,
        rating_count: story.rating_count + 1,
      },
    });

    delete newRating.is_deleted;

    redisUtils.ratings(newRating.story_id).incr();

    return { success: true, data: newRating };
  });
}

export async function UpdateRating(id, { star, title, content }) {
  if (!id) throw CreateError(400, "Require 'id' for update rating");

  const updating = await db.rating.update({
    where: { id: id },
    data: {
      ...(star && { star: star }),
      ...(title && { title: title }),
      ...(content && { content: content }),
    },
    include: { user: { select: { id: true, name: true, avatar: true } } },
  });

  redisUtils.ratings(updating.id).incr();
  redisUtils.ratings(updating.story_id).incr();

  return { success: true, data: updating };
}

export async function SoftDeleteRating(ratingId) {
  const removing = await db.rating.update({
    where: { id: ratingId },
    data: { is_deleted: true },
  });

  redisUtils.ratings(removing.id).incr();
  redisUtils.ratings(removing.story_id).incr();

  return { success: true, data: removing };
}

export async function HardDeleteRating(ratingId) {
  const remove = await db.rating.delete({
    where: { id: ratingId },
  });

  redisUtils.ratings(remove.id).incr();
  redisUtils.ratings(remove.story_id).incr();

  return { success: true, data: remove };
}
