import { redis } from "../configs/redis.js";
import { Queue } from "bullmq";

const connection = {
  host: redis.options.host,
  port: redis.options.port,
  password: redis.options.password,
};

const ATTEMP = 3;
const DELAY = 5000;

const ADD_JOB_OPTION = { attempts: ATTEMP, backoff: { type: "exponential", delay: DELAY }, removeOnComplete: true, removeOnFail: true };

class ImageQueue {
  #permenantDeletedManyImagesQueue = new Queue("permenant-delete-many-images", { connection });
  #permenantDeltedImageQueue = new Queue("permenant-delete-image", { connection });

  addJobPermenantDeleteManyImages(imageIds) {
    this.#permenantDeletedManyImagesQueue.add("permenantDeleteManyImages", { imageIds }, ADD_JOB_OPTION);
  }

  addJobPermenantDeleteImage(imageId) {
    this.#permenantDeltedImageQueue.add("permenantDeleteImage", { imageId }, ADD_JOB_OPTION);
  }
}

const imageQueue = new ImageQueue();
export default imageQueue;
