import db from "../../configs/db.js";

import redisUtils from "../utils/Redis.js";

import { redis } from "../../configs/redis.js";

const REDIS_TTL = 60 * 60 * 24; // 24 hours

export async function GetAllGenres() {
  const genresVer = await redisUtils.genres().get();

  const REDIS_KEY = ["GetAllGenres", "genresVer=" + genresVer].join(":");

  const cached = await redis.get(REDIS_KEY);
  if (cached) return JSON.parse(cached);

  const genres = await db.genre.findMany({
    where: { deleted_status: "not_deleted" },
    select: {
      id: true,
      name: true,
      description: true,
      thumbnail: { select: { url: true, key: true } },
    },
    orderBy: { name: "asc" },
  });

  const result = { success: true, data: genres };

  redis.setex(REDIS_KEY, REDIS_TTL, JSON.stringify(result));

  return result;
}

export async function AddManyStoryGenres(data = {}) {
  try {
    const storyGenre = await db.story_Genre.createMany({ data: data });
    return { success: true, data: storyGenre };
  } catch (error) {
    return { success: false, error: error.code };
  }
}
