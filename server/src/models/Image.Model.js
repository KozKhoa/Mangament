import db from "../configs/db.js";
import { redis } from "../configs/redis.js";
import redisService from "../services/redis.service.js";
import { CreateError } from "../utils/ErrorHandle.js";

import * as r2CloudflareService from "../services/r2-cloudflare.service.js";

const REDIS_TTL = 60 * 30;

export async function FindImage({ id, url }) {
  if (!id && !url) throw CreateError(400, "Require 'id' or 'url'");

  const imageVer = await redisService.image(url || id).get();
  const REDIS_KEY = ["FindImage", imageVer, id, url].join(":");

  const cached = await redis.get(REDIS_KEY);
  if (cached) return JSON.parse(cached);

  const result = await db.image.findFirst({
    where: {
      is_deleted: false,
      id,
      url,
    },
  });

  redis.setex(REDIS_KEY, REDIS_TTL, JSON.stringify({ success: true, data: result }));

  return { success: true, data: result };
}

export async function AddImage({ url, key, public_id }) {
  const addImage = await db.image.create({ data: { url, public_id, key } }).catch(async (error) => {
    return { success: true, data: await db.image.findUnique({ where: { url: url } }) };
  });

  return { success: true, data: addImage };
}

export async function SoftDeleteImage({ id, url }) {
  if (!id && !url) throw CreateError(400, "Require 'id' or 'url'");

  const softDelete = await db.image.update({
    where: { ...(id && { id: id }), ...(url && { url: url }) },
    data: { is_deleted: true },
  });

  redisService.image(id).incr();
  redisService.image(url).incr();

  return { success: true, data: softDelete };
}

export async function HardDeleteImage({ id, url }) {
  // Hard delete image also mean remove it in cloudflare
  if (!id && !url) throw CreateError(400, "Require 'id' or 'url'");

  const image = await db.image.findFirst({
    where: { ...(id && { id: id }), ...(url && { url: url }) },
  });

  if (!image) throw CreateError(404, "Image not found");

  await r2CloudflareService.deleteObject(image.key);

  await db.image.delete({ where: { ...(id && { id: id }), ...(url && { url: url }) } });

  redisService.image().incr();
  redisService.image(id).incr();
  redisService.image(url).incr();

  return { success: true, message: "Remove permanently" };
}

export async function HardDeleteManyImages({ ids = [], urls = [] }) {
  if (ids.length === 0 && urls.length === 0) throw CreateError(400, "Require 'id' or 'url'");

  const images = await db.image.findMany({
    where: { ...(ids.length > 0 && { id: { in: ids } }), ...(urls.length > 0 && { url: { in: urls } }) },
  });

  if (images.length <= 0) throw CreateError(404, "Image not found");

  await r2CloudflareService.deleteManyObjects(images.map((image) => image.key));

  await db.image.deleteMany({ where: { ...(ids.length > 0 && { id: { in: ids } }), ...(urls.length > 0 && { url: { in: urls } }) } });

  redisService.image().incr();
  ids.forEach((id) => redisService.image(id).incr());
  urls.forEach((url) => redisService.image(url).incr());

  return { success: true, message: "Remove permanently" };
}

// This will find the images that are not used by any user, story, nation or story node content
export async function FindTrashImage({ page = 1, limit = 10 }) {
  const imageVer = await redisService.image().get();
  const REDIS_KEY = ["FindTrashImage", "v=" + imageVer, "page=" + page, "limit=" + limit].join(":");

  const cached = await redis.get(REDIS_KEY);
  if (cached) return JSON.parse(cached);

  const where = {
    user: { none: {} },
    story: { none: {} },
    nation: { none: {} },
    story_node_content: { none: {} },
  };

  const trashImage = await db.image.findMany({
    where: where,

    take: Number(limit),
    skip: Number((page - 1) * limit),
  });

  const totalItems = await db.image.count({ where: where });

  const result = {
    success: true,
    data: trashImage,
    pagination: {
      page: page,
      pageSize: trashImage.length,
      totalPages: Math.ceil(totalItems / limit),
      totalItems: totalItems,
    },
  };

  redis.setex(REDIS_KEY, REDIS_TTL, JSON.stringify(result));

  return result;
}
