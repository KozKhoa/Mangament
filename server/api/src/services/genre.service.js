import db from "../../configs/db.js";

import redisUtils from "../utils/Redis.js";

import { redis } from "../../configs/redis.js";

const REDIS_TTL = 60 * 60 * 24; // 24 hours

const WEIGHTS = {
  views: 5,
  rating: 4,
  favourites: 3,
};

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

export async function GetTrendingGenres({ limit = 10, page = 1 }) {
  const genresVer = await redisUtils.genres().get();

  const REDIS_KEY = ["genres", "v=" + genresVer, "trending", "all"].join(":");

  const cached = await redis.get(REDIS_KEY);
  if (cached) {
    const genresScore = JSON.parse(cached);
    return {
      success: true,
      data: genresScore.slice((page - 1) * limit, page * limit),
      pagination: {
        page: page,
        pageSize: limit,
        totalItems: genresScore.length,
        totalPages: Math.ceil(genresScore.length / limit),
      },
    };
  }

  const sevenDaysAgo = new Date();
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

  const topViewedGenresPromise = db.$queryRaw`
    SELECT sg.genre_id, COUNT(sg.story_id)::INTEGER as total_views
    FROM "Story_Genre" sg
    INNER JOIN "ReadingHistory" rh ON sg.story_id = rh.story_id
    WHERE rh.created_at >= ${sevenDaysAgo}
    GROUP BY sg.genre_id
    ORDER BY total_views DESC;
  `;

  const topRatingGenresPromise = db.$queryRaw`
    SELECT sg.genre_id, AVG(s.star)::FLOAT as avg_rating
    FROM "Story_Genre" sg
    INNER JOIN "Story" s ON sg.story_id = s.id
    WHERE s.star IS NOT NULL
    GROUP BY sg.genre_id
    ORDER BY avg_rating DESC;
  `;

  const topFavouriteGenresPromise = db.$queryRaw`
    SELECT sg.genre_id, COUNT(sg.story_id)::INTEGER as total_favourites
    FROM "Story_Genre" sg
    INNER JOIN "FavouriteStory" f ON sg.story_id = f.story_id
    WHERE f.created_at >= ${sevenDaysAgo}
    GROUP BY sg.genre_id
    ORDER BY total_favourites DESC;
  `;

  const [genres, topViewedGenres, topRatingGenres, topFavouriteGenres] = await Promise.all([
    db.genre.findMany({ select: { id: true, name: true, description: true, thumbnail: { select: { url: true, key: true } } } }),
    topViewedGenresPromise,
    topRatingGenresPromise,
    topFavouriteGenresPromise,
  ]);

  const topViewGenresMap = new Map(topViewedGenres.map((item) => [item.genre_id, item.total_views]));
  const topRatingGenresMap = new Map(topRatingGenres.map((item) => [item.genre_id, item.avg_rating]));
  const topFavouriteGenresMap = new Map(topFavouriteGenres.map((item) => [item.genre_id, item.total_favourites]));

  const genresScore = [];
  genres.forEach((genre) => {
    const views = topViewGenresMap.get(genre.id) || 0;
    const rating = topRatingGenresMap.get(genre.id) || 0;
    const favourites = topFavouriteGenresMap.get(genre.id) || 0;

    const score = views * WEIGHTS.views + rating * WEIGHTS.rating + favourites * WEIGHTS.favourites;

    genresScore.push({ genre, score });
  });

  genresScore.sort((a, b) => b.score - a.score);

  await redis.setex(REDIS_KEY, REDIS_TTL, JSON.stringify(genresScore));

  const topGenres = genresScore.slice((page - 1) * limit, page * limit);

  return {
    success: true,
    data: topGenres,
    pagination: {
      page: page,
      pageSize: limit,
      totalItems: genresScore.length,
      totalPages: Math.ceil(genresScore.length / limit),
    },
  };
}

/**
 * @param {Array<string>} genres
 * @param {Array<string>} descriptions
 * @param {Array<{
 *   url?: string,
 *   key: string
 * }>} thumbnails
 * @returns
 */
export async function AddManyGenres(genres, descriptions, thumbnails) {
  // Check if genres already exists
  const allGenres = await db.genre.findMany();
  const genresSet = new Set(allGenres.map((genre) => genre.name));

  const valideGenres = [];
  const invalidGenres = [];

  let i = 0;
  for (const newGenre of genres) {
    if (!genresSet.has(newGenre)) {
      valideGenres.push({ name: newGenre, description: descriptions[i], thumbnail: thumbnails[i] });
    } else {
      invalidGenres.push({ name: newGenre, description: descriptions[i], thumbnail: thumbnails[i] });
    }
    i++;
  }

  // Add genres to db
  await db.genre.createMany({ data: valideGenres });

  return {
    success: true,
    message: invalidGenres.length <= 0 ? "Add successfully" : `${invalidGenres.join(",")} already exists`,
  };
}

export async function AddManyStoryGenres(data = {}) {
  try {
    const storyGenre = await db.story_Genre.createMany({ data: data });
    return { success: true, data: storyGenre };
  } catch (error) {
    return { success: false, error: error.code };
  }
}
