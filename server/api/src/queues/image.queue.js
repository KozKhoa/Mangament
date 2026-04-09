import { redis } from "../configs/redis.js";

import { Queue, Worker } from "bullmq";
import * as storyService from "../services/story.service.js";
import db from "../configs/db.js";
import r2CloudflareUtils from "../utils/R2Cloudflare.js";

const connection = {
  host: redis.options.host,
  port: redis.options.port,
  password: redis.options.password,
};

const ATTEMP = 3;
const DELAY = 5000;

const ADD_JOB_OPTION = { attempts: ATTEMP, backoff: { type: "exponential", delay: DELAY }, removeOnComplete: true, removeOnFail: true };

const permenantDeletedImagesQueue = new Queue("permenant-delete-images", { connection });
const permenantDeletedImagesWorker = new Worker(
  "permenant-delete-image",
  async (job) => {
    const { imageIds } = job.data;

    const images = (await db.image.findMany({ where: { id: { in: imageIds } }, select: { key: true } })).filter((image) => image.key);

    await db.image.deleteMany({
      where: { id: { in: imageIds } },
    });

    await r2CloudflareUtils.deleteManyObjects(images.map((image) => image.key));
  },
  { connection, concurrency: 1 },
);

export function AddJobPermenantDeleteImages(imageIds) {
  permenantDeletedImagesQueue.add("permenantDeleteImages", { imageIds }, ADD_JOB_OPTION);
}
