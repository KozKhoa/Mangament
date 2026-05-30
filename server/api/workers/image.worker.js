import { redis } from "../configs/redis.js";
import { Worker } from "bullmq";
import db from "../configs/db.js";
import r2CloudflareUtils from "../src/utils/R2Cloudflare.js";
import sharp from "sharp";
import pLimit from "p-limit";

import * as imageService from "../src/services/image.service.js";

const connection = {
  host: redis.options.host,
  port: redis.options.port,
  password: redis.options.password,
};

const permenantDeletedManyImagesWorker = new Worker(
  "permenant-delete-many-images",
  async (job) => {
    const { imageIds } = job.data;

    const images = (await db.image.findMany({ where: { id: { in: imageIds } }, select: { key: true } })).filter((image) => image.key);

    await db.image.deleteMany({ where: { id: { in: imageIds } } });

    await r2CloudflareUtils.deleteManyObjects(images.map((image) => image.key));

    console.log("Permenant deleted many images", imageIds);
  },

  { connection, concurrency: 3 },
);

const permenantDeletedImageWorker = new Worker(
  "permenant-delete-image",
  async (job) => {
    const { imageId } = job.data;

    const image = await db.image.findUnique({ where: { id: imageId } });

    if (!image) return;

    await db.image.delete({ where: { id: imageId } });

    await r2CloudflareUtils.deleteObject(image.key);

    console.log("Permenant deleted image", imageId);
  },

  { connection, concurrency: 10 },
);

const addNewImageWorker = new Worker(
  "add-new-image",
  async (job) => {
    try {
      const { key, file, resize, quality = 80 } = job.data;

      const url = `${process.env.CDN_URL}/${key}`;

      const buffer = Buffer.from(file.buffer.data);

      const optimizedBuffer = await sharp(buffer)
        .jpeg({
          quality: quality,
          mozjpeg: true,
        })
        .resize(resize ? resize : undefined)
        .toBuffer();

      await Promise.all([r2CloudflareUtils.uploadObject(key, optimizedBuffer, file.mimetype), imageService.AddImage({ url, key })]);

      console.log("Added image " + key + " successfully");
    } catch (error) {
      console.error("Added image failed");
      console.error(error);
    }
  },
  { connection, concurrency: 10 },
);

const addManyNewImagesWorker = new Worker(
  "add-many-new-images",
  async (job) => {
    const { keys = [], files = [], quality = 80, resize } = job.data;

    const limit = pLimit(10); // xử lý tối đa 10 ảnh cùng lúc

    await Promise.all(
      files.map((file, index) =>
        limit(async () => {
          const buffer = Buffer.from(file.buffer.data);

          const optimized = await sharp(buffer)
            .jpeg({
              quality: quality,
              mozjpeg: true,
            })
            .resize(resize ? resize : undefined)
            .toBuffer();

          const key = keys[index];
          const url = `${process.env.CDN_URL}/${key}`;

          await Promise.all([r2CloudflareUtils.uploadObject(key, optimized, file.mimetype), imageService.AddImage({ url, key })]);

          console.log("Added image " + key + " successfully");
        }),
      ),
    );
  },
  { connection, concurrency: 1 },
);

export default { permenantDeletedManyImagesWorker, permenantDeletedImageWorker, addNewImageWorker, addManyNewImagesWorker };
