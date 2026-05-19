import db from "../../configs/db.js";
import { redis } from "../../configs/redis.js";
import redisUtils from "../utils/Redis.js";
import { CreateError } from "../utils/ErrorHandle.js";

import imageQueue from "../../queues/image.queue.js";

const REDIS_TTL = 60 * 30;

export async function FindImage({ id, url }) {
  if (!id && !url) throw CreateError(400, "Require 'id' or 'url'");

  const imageVer = await redisUtils.image(url || id).get();
  const REDIS_KEY = ["FindImage", imageVer, id, url].join(":");

  const cached = await redis.get(REDIS_KEY);
  if (cached) return JSON.parse(cached);

  const result = await db.image.findFirst({
    where: {
      deleted_status: "not_deleted",
      id,
      url,
    },
  });

  redis.setex(REDIS_KEY, REDIS_TTL, JSON.stringify({ success: true, data: result }));

  return { success: true, data: result };
}

export async function AddImage({ url, key }) {
  const addImage = await db.image.create({ data: { url, key } }).catch(async (error) => {
    return { success: false, message: "Url already exists", data: await db.image.findUnique({ where: { url: url } }) };
  });

  return addImage;
}

export async function SoftDeleteImage({ id, url }) {
  if (!id && !url) throw CreateError(400, "Require 'id' or 'url'");

  const softDelete = await db.image.update({
    where: { ...(id && { id: id }), ...(url && { url: url }) },
    data: { deleted_status: "soft_deleted" },
  });

  redisUtils.image(id).incr();
  redisUtils.image(url).incr();

  return { success: true, data: softDelete };
}

export async function HardDeleteImage({ id, url }) {
  // Hard delete image also mean remove it in cloudflare
  if (!id && !url) throw CreateError(400, "Require 'id' or 'url'");

  const image = await db.image.update({
    where: {
      ...(id && { id: id }),
      ...(url && { url: url }),
    },
    data: { deleted_status: "pending_permanent_deletion" },
    select: { id: true },
  });

  if (!image) throw CreateError(404, "Image not found");

  imageQueue.addJob_PermenantDeleteImage(image.id);

  redisUtils.image().incr();
  redisUtils.image(id).incr();
  redisUtils.image(url).incr();

  return { success: true, message: "Remove permanently" };
}

export async function HardDeleteManyImages({ ids = [], urls = [] }) {
  if (ids.length === 0 && urls.length === 0) throw CreateError(400, "Require 'id' or 'url'");

  const imageIds = await db.image.updateManyAndReturn({
    where: {
      ...(ids && ids.length > 0 && { id: { in: ids } }),
      ...(urls && urls.length > 0 && { url: { in: urls } }),
    },
    data: { deleted_status: "pending_permanent_deletion" },
    select: { id: true },
  });

  imageQueue.addJob_PermenantDeleteManyImages(imageIds.map((image) => image.id));

  redisUtils.image().incr();
  ids.forEach((id) => redisUtils.image(id).incr());
  urls.forEach((url) => redisUtils.image(url).incr());

  return { success: true, message: "Remove permanently" };
}

// This will find the images that are not used by any user, story, nation or story node content
export async function FindTrashImage({ page = 1, limit = 10 }) {
  const imageVer = await redisUtils.image().get();
  const REDIS_KEY = ["FindTrashImage", "v=" + imageVer, "page=" + page, "limit=" + limit].join(":");

  const cached = await redis.get(REDIS_KEY);
  if (cached) return JSON.parse(cached);

  const where = {
    user: { none: {} },
    story: { none: {} },
    nation: { none: {} },
    story_node_content: { none: {} },
    deleted_status: { not: "pending_permanent_deletion" },
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
