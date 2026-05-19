import { redis } from "../configs/redis.js";
import { Worker } from "bullmq";
import db from "../configs/db.js";
import r2CloudflareUtils from "../src/utils/R2Cloudflare.js";
import sharp from "sharp";

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

const addNewImage = new Worker("add-new-image", async (job) => {
  const { key, file } = job.data;

  const url = `${process.env.CDN_URL}/${key}`;

  const optimizedBuffer = await sharp(file.buffer)
    .resize({ width: 300 })
    .jpeg({
      quality: 80,
      mozjpeg: true,
    })
    .toBuffer();

  const result = await Promise.all([r2CloudflareUtils.uploadObject(key, optimizedBuffer, file.mimetype), imageService.AddImage({ url, key })]);

  console.log("Add image " + key + " successfully");
});

export default { permenantDeletedManyImagesWorker, permenantDeletedImageWorker };
