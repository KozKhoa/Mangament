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
  #permenantDeletedImagesQueue = new Queue("permenant-delete-images", { connection });

  addJobPermenantDeleteImages(imageIds) {
    this.#permenantDeletedImagesQueue.add("permenantDeleteImages", { imageIds }, ADD_JOB_OPTION);
  }
}

const imageQueue = new ImageQueue();
export default imageQueue;
