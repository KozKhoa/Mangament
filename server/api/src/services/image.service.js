import db from "../../configs/db.js";
import { redis } from "../../configs/redis.js";
import redisUtils from "../utils/Redis.js";
import { CreateError } from "../utils/ErrorHandle.js";

import imageQueue from "../../worker/queues/image.queue.js";

const REDIS_TTL = 60 * 30;

export async function FindImage({ id, path, url }) {
  const imagePath = path || url;
  if (!id && !imagePath) throw CreateError(400, "Require 'id' or 'path'");

  const imageVer = await redisUtils.image(imagePath || id).get();
  const REDIS_KEY = ["FindImage", imageVer, id, imagePath].join(":");

  const cached = await redis.get(REDIS_KEY);
  if (cached) return JSON.parse(cached);

  const result = await db.image.findFirst({
    where: {
      deleted_status: "not_deleted",
      ...(id && { id }),
      ...(imagePath && { path: imagePath }),
    },
  });

  redis.setex(REDIS_KEY, REDIS_TTL, JSON.stringify({ success: true, data: result }));

  return { success: true, data: result };
}

export async function InsertImage({ provider = "local", mine_type = "image/jpeg", size = 0, path, key, url, width, height, metadata }) {
  const resolvedPath = path || key || url;

  if (resolvedPath) {
    const existing = await db.image.findUnique({ where: { path: resolvedPath } });
    if (existing) throw CreateError(409, "Image already exists");
  }

  const metaString = metadata ? (typeof metadata === "string" ? metadata : JSON.stringify(metadata)) : null;

  const data = {
    provider,
    mine_type: mine_type || "image/jpeg",
    size: size ? Number(size) : 0,
    path: resolvedPath || null,
    width: width ? Number(width) : null,
    height: height ? Number(height) : null,
    metadata: metaString,
  };

  const image = await db.image.create({ data });
  return { success: true, data: image };
}

export async function UpdateImage({ id, provider, mine_type, size, path, key, url, width, height, metadata, deleted_status }) {
  if (!id) throw CreateError(400, "Require 'id'");

  const existing = await db.image.findUnique({ where: { id } });
  if (!existing) throw CreateError(404, "Image not found");

  const resolvedPath = path || key || url;
  const updateData = {
    ...(provider !== undefined && { provider }),
    ...(mine_type !== undefined && { mine_type }),
    ...(size !== undefined && { size: Number(size) }),
    ...(resolvedPath !== undefined && { path: resolvedPath }),
    ...(width !== undefined && { width: width ? Number(width) : null }),
    ...(height !== undefined && { height: height ? Number(height) : null }),
    ...(metadata !== undefined && {
      metadata: typeof metadata === "string" ? metadata : metadata ? JSON.stringify(metadata) : null,
    }),
    ...(deleted_status !== undefined && { deleted_status }),
  };

  const updatedImage = await db.image.update({
    where: { id },
    data: updateData,
  });

  redisUtils.image(id).incr();
  if (existing.path) redisUtils.image(existing.path).incr();
  if (resolvedPath && resolvedPath !== existing.path) redisUtils.image(resolvedPath).incr();

  return { success: true, data: updatedImage };
}

export async function UpsertImage({ id, provider = "local", mine_type = "image/jpeg", size = 0, path, key, url, width, height, metadata, deleted_status }) {
  if (!id) {
    return await InsertImage({ provider, mine_type, size, path, key, url, width, height, metadata });
  }

  const existing = await db.image.findUnique({ where: { id } });
  if (existing) {
    return await UpdateImage({
      id,
      provider,
      mine_type,
      size,
      path,
      key,
      url,
      width,
      height,
      metadata,
      deleted_status,
    });
  }

  const resolvedPath = path || key || url;
  const metaString = metadata ? (typeof metadata === "string" ? metadata : JSON.stringify(metadata)) : null;

  const data = {
    id,
    provider,
    mine_type: mine_type || "image/jpeg",
    size: size ? Number(size) : 0,
    path: resolvedPath || null,
    width: width ? Number(width) : null,
    height: height ? Number(height) : null,
    metadata: metaString,
    ...(deleted_status !== undefined && { deleted_status }),
  };

  const image = await db.image.create({ data });
  return { success: true, data: image };
}

export async function SoftDeleteImage({ id, path, url }) {
  const imagePath = path || url;
  if (!id && !imagePath) throw CreateError(400, "Require 'id' or 'path'");

  const softDelete = await db.image.update({
    where: { ...(id && { id: id }), ...(imagePath && { path: imagePath }) },
    data: { deleted_status: "soft_deleted" },
  });

  if (id) redisUtils.image(id).incr();
  if (imagePath) redisUtils.image(imagePath).incr();

  return { success: true, data: softDelete };
}

export async function HardDeleteImage({ id, path, url }) {
  // Hard delete image also mean remove it in cloudflare or local storage
  const imagePath = path || url;
  if (!id && !imagePath) throw CreateError(400, "Require 'id' or 'path'");

  const image = await db.image.update({
    where: {
      ...(id && { id: id }),
      ...(imagePath && { path: imagePath }),
    },
    data: { deleted_status: "pending_permanent_deletion" },
    select: { id: true, path: true, provider: true },
  });

  if (!image) throw CreateError(404, "Image not found");

  imageQueue.addJob_PermenantDeleteImage(image.id);

  redisUtils.image().incr();
  if (id) redisUtils.image(id).incr();
  if (imagePath) redisUtils.image(imagePath).incr();

  return { success: true, message: "Remove permanently" };
}

export async function HardDeleteManyImages({ ids = [], paths = [], urls = [] }) {
  const allPaths = [...paths, ...urls];
  if (ids.length === 0 && allPaths.length === 0) throw CreateError(400, "Require 'id' or 'path'");

  const imageIds = await db.image.updateManyAndReturn({
    where: {
      ...(ids && ids.length > 0 && { id: { in: ids } }),
      ...(allPaths && allPaths.length > 0 && { path: { in: allPaths } }),
    },
    data: { deleted_status: "pending_permanent_deletion" },
    select: { id: true, path: true, provider: true },
  });

  imageQueue.addJob_PermenantDeleteManyImages(imageIds.map((image) => image.id));

  redisUtils.image().incr();
  ids.forEach((id) => redisUtils.image(id).incr());
  allPaths.forEach((p) => redisUtils.image(p).incr());

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
