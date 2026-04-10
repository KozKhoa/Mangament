import { redis } from "../configs/redis.js";
import { Worker } from "bullmq";
import db from "../configs/db.js";
import r2CloudflareUtils from "../src/utils/R2Cloudflare.js";

const connection = {
  host: redis.options.host,
  port: redis.options.port,
  password: redis.options.password,
};

const permenantDeletedImagesWorker = new Worker(
  "permenant-delete-images",
  async (job) => {
    const { imageIds } = job.data;

    const images = (await db.image.findMany({ where: { id: { in: imageIds } }, select: { key: true } })).filter((image) => image.key);

    await db.image.deleteMany({
      where: { id: { in: imageIds } },
    });

    await r2CloudflareUtils.deleteManyObjects(images.map((image) => image.key));

    console.log("Permenant deleted images", imageIds);
  },

  { connection, concurrency: 1 },
);

export default permenantDeletedImagesWorker;
