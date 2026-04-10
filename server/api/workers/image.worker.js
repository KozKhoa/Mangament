import { redis } from "../configs/redis.js";
import { Worker } from "bullmq";
import db from "../configs/db.js";
import r2CloudflareUtils from "../src/utils/R2Cloudflare.js";

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

  { connection, concurrency: 1 },
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

  { connection, concurrency: 3 },
);

export default { permenantDeletedManyImagesWorker, permenantDeletedImageWorker };
