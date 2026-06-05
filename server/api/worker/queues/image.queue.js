import { redis } from "../../configs/redis.js";
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
  #addNewImage = new Queue("add-new-image", { connection });
  #addManyNewImages = new Queue("add-many-new-images", { connection });

  addJob_PermenantDeleteManyImages(imageIds) {
    this.#permenantDeletedManyImagesQueue.add("permenantDeleteManyImages", { imageIds }, ADD_JOB_OPTION);
  }

  addJob_PermenantDeleteImage(imageId) {
    this.#permenantDeltedImageQueue.add("permenantDeleteImage", { imageId }, ADD_JOB_OPTION);
  }

  addJob_AddNewImage({ key, file, quality = 80, resize }) {
    // resize = {width, height}
    // quality: 1-100
    this.#addNewImage.add("addNewImage", { key, file, quality, resize }, ADD_JOB_OPTION);
  }

  addJob_addManyNewImages({ keys = [], files = [], quality = 80, resize }) {
    this.#addManyNewImages.add("addManyNewImages", { keys, files, quality, resize }, ADD_JOB_OPTION);
  }
}

const imageQueue = new ImageQueue();
export default imageQueue;
