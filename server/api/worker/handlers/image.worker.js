import { redis } from "../../configs/redis.js";
import { Worker } from "bullmq";
import db from "../../configs/db.js";
import sharp from "sharp";
import pLimit from "p-limit";

import { getStorageProvider } from "../../src/storage/index.js";
import * as imageService from "../../src/services/image.service.js";

function getBuffer(file) {
  if (!file) return null;
  if (Buffer.isBuffer(file)) return file;
  if (file.buffer) {
    if (Buffer.isBuffer(file.buffer)) return file.buffer;
    if (file.buffer.data) return Buffer.from(file.buffer.data);
    return Buffer.from(file.buffer);
  }
  return null;
}

const connection = {
  host: redis?.options?.host || "localhost",
  port: redis?.options?.port || 6379,
  password: redis?.options?.password,
};

const permenantDeletedManyImagesWorker = new Worker(
  "permenant-delete-many-images",
  async (job) => {
    const { imageIds } = job.data;

    const images = (await db.image.findMany({ where: { id: { in: imageIds } }, select: { path: true, provider: true } })).filter((image) => image.path);

    await db.image.deleteMany({ where: { id: { in: imageIds } } });

    // Group images by provider to delete from corresponding storage
    const byProvider = {};
    for (const img of images) {
      const p = img.provider || "local";
      if (!byProvider[p]) byProvider[p] = [];
      byProvider[p].push(img.path);
    }

    for (const [providerName, paths] of Object.entries(byProvider)) {
      try {
        const storage = getStorageProvider(providerName);
        await storage.deleteMany(paths);
      } catch (error) {
        console.error(`Failed to delete images from provider ${providerName}:`, error);
      }
    }

    console.log("Permenant deleted many images", imageIds);
  },

  { connection, concurrency: 3 },
);

const permenantDeletedImageWorker = new Worker(
  "permenant-delete-image",
  async (job) => {
    const { imageId } = job.data;

    const image = await db.image.findUnique({ where: { id: imageId }, select: { id: true, path: true, provider: true } });

    if (!image) return;

    await db.image.delete({ where: { id: imageId } });

    if (image.path) {
      try {
        const storage = getStorageProvider(image.provider || "local");
        await storage.delete(image.path);
      } catch (error) {
        console.error(`Failed to delete image ${image.path} from provider ${image.provider}:`, error);
      }
    }

    console.log("Permenant deleted image", imageId);
  },

  { connection, concurrency: 10 },
);

const addNewImageWorker = new Worker(
  "add-new-image",
  async (job) => {
    try {
      const { id, key, file, resize, quality = 80, provider } = job.data;

      const buffer = getBuffer(file);
      if (!buffer) return;

      const imageSharp = sharp(buffer);
      const metadata = await imageSharp.metadata();

      let pipeline = sharp(buffer);
      if (resize) pipeline = pipeline.resize(resize);

      const optimizedBuffer = await pipeline
        .jpeg({
          quality: quality,
          mozjpeg: true,
        })
        .toBuffer();

      const storage = getStorageProvider(provider);
      await storage.upload(key, optimizedBuffer, "image/jpeg");

      await imageService.UpsertImage({
        id,
        provider: storage.name,
        mine_type: "image/jpeg",
        size: optimizedBuffer.length,
        path: key,
        width: metadata.width,
        height: metadata.height,
        metadata: {
          original_name: file.originalname,
        },
      });

      console.log("Added image " + key + " successfully");
    } catch (error) {
      console.error("Added image failed", error);
    }
  },
  { connection, concurrency: 10 },
);

const addManyNewImagesWorker = new Worker(
  "add-many-new-images",
  async (job) => {
    try {
      const { ids = [], keys = [], files = [], quality = 80, resize, provider } = job.data;

      const limit = pLimit(10); // xử lý tối đa 10 ảnh cùng lúc
      const storage = getStorageProvider(provider);

      await Promise.all(
        files.map((file, index) =>
          limit(async () => {
            const buffer = getBuffer(file);
            if (!buffer) return;

            const imageSharp = sharp(buffer);
            const metadata = await imageSharp.metadata();

            let pipeline = sharp(buffer);
            if (resize) pipeline = pipeline.resize(resize);

            const optimized = await pipeline
              .jpeg({
                quality: quality,
                mozjpeg: true,
              })
              .toBuffer();

            const key = keys[index];
            const id = ids[index];

            await storage.upload(key, optimized, "image/jpeg");

            await imageService.UpsertImage({
              id,
              provider: storage.name,
              mine_type: "image/jpeg",
              size: optimized.length,
              path: key,
              width: metadata.width,
              height: metadata.height,
              metadata: {
                original_name: file.originalname,
              },
            });

            console.log("Added image " + key + " successfully");
          }),
        ),
      );
    } catch (error) {
      console.error("addManyNewImagesWorker error:", error);
    }
  },
  { connection, concurrency: 1 },
);

const addStoryImagesWorker = new Worker(
  "add-story-images",
  async (job) => {
    try {
      const { images = [], quality = 80, resize } = job.data;
      const limit = pLimit(5);

      await Promise.all(
        images.map((item) =>
          limit(async () => {
            const { id, filename, path: relativePath, provider, file } = item;
            const buffer = getBuffer(file);
            if (!buffer) {
              console.error(`Invalid buffer for story image ${id} (${filename})`);
              return;
            }

            const imageSharp = sharp(buffer);
            const metadata = await imageSharp.metadata();

            let pipeline = sharp(buffer);
            if (resize) pipeline = pipeline.resize(resize);

            const optimizedBuffer = await pipeline
              .jpeg({
                quality: quality,
                mozjpeg: true,
              })
              .toBuffer();

            const storage = getStorageProvider(provider);
            await storage.upload(relativePath, optimizedBuffer, "image/jpeg");

            await imageService.UpsertImage({
              id,
              provider: storage.name,
              mine_type: "image/jpeg",
              size: optimizedBuffer.length,
              path: relativePath,
              width: metadata.width,
              height: metadata.height,
              metadata: {
                original_name: file.originalname,
              },
            });

            console.log(`Added story image ${filename} (id: ${id}) successfully`);
          }),
        ),
      );
    } catch (error) {
      console.error("addStoryImagesWorker error:", error);
    }
  },
  { connection, concurrency: 2 },
);

export default {
  permenantDeletedManyImagesWorker,
  permenantDeletedImageWorker,
  addNewImageWorker,
  addManyNewImagesWorker,
  addStoryImagesWorker,
};
