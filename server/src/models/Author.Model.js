import db from "../configs/db.js";
import { redis } from "../configs/redis.js";
import redisService from "../services/redis.service.js";

const REDIS_TTL = 60 * 30;

export async function FindAllAuthors({ page = 1, limit = 10, sort = { name: "asc" } }) {
  const authorsVer = redisService.authors().get();

  const REDIS_KEY = ["FindAllAuthors", `ver=${authorsVer}`, `page=${page}`, `limit=${limit}`, `sort=${JSON.stringify(sort)}`].join(":");

  const cached = await redis.get(REDIS_KEY);
  if (cached) return JSON.parse(cached);

  const authors = await db.author.findMany({
    take: limit,
    skip: (page - 1) * limit,
    orderBy: sort,
    include: { avatar: true, nation: true },
  });

  const totalItems = await db.author.count();
  const totalPages = Math.ceil(totalItems / limit);

  const result = {
    success: true,
    data: authors,
    pagination: {
      page: page,
      pageSize: limit,
      totalItems: totalItems,
      totalPages: totalPages,
    },
  };

  await redis.setex(REDIS_KEY, REDIS_TTL, JSON.stringify(result));

  return result;
}

export async function FindAuthor(id) {
  const authorsVer = redisService.authors().get();

  const REDIS_KEY = ["FindAuthor", `ver=${authorsVer}`, `id=${id}`].join(":");

  const cached = await redis.get(REDIS_KEY);
  if (cached) return JSON.parse(cached);

  const author = await db.author.findUnique({ where: { id: id }, include: { avatar: true, nation: true } });

  const result = { success: true, data: author };

  await redis.setex(REDIS_KEY, REDIS_TTL, JSON.stringify(result));

  return result;
}

export async function AddAuthor({ name, nationId, avatarId }) {
  const author = await db.author.create({ data: { name, nationId, avatarId } });

  redisService.authors().incr();

  return { success: true, data: author };
}

export async function HardDeleteAuthor(id) {
  const author = await db.author.delete({ where: { id: id } });
  s;
  redisService.authors().incr();

  return { success: true, data: author };
}

export async function UpdateAuthor(id, { name, nationId, avatarId }) {
  const author = await db.author.update({ where: { id: id }, data: { name: name, nation_id: nationId, avatar_id: avatarId } });

  redisService.authors().incr();

  return { success: true, data: author };
}
