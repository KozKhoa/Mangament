import crypto from "crypto";

import imageQueue from "../../worker/queues/image.queue.js";
import { getStorageProvider } from "../storage/index.js";

const MAX_FILE_SIZE = 20 * 1024 * 1024; // 20MB
const MAX_STORY_IMAGES_COUNT = 50; // 50 images per batch

class UploadService {
  async uploadAvatar(userId, file) {
    if (!file) {
      const error = new Error("Vui lòng tải lên file hình ảnh avatar");
      error.status = 400;
      throw error;
    }

    if (file.size && file.size > MAX_FILE_SIZE) {
      const error = new Error("Dung lượng avatar vượt quá giới hạn tối đa 20MB");
      error.status = 413;
      throw error;
    }

    const storage = getStorageProvider();
    const id = crypto.randomUUID();
    const filename = `_avatar_${userId}_${id}.jpg`;
    const path = storage.generatePath("avatars", filename);
    const url = storage.getUrl(path);

    imageQueue.addJob_AddNewImage({
      id,
      key: path,
      file,
      resize: { width: 300 },
      quality: 80,
      provider: storage.name,
    });

    return {
      success: true,
      data: {
        id,
        key: path,
        path,
        url,
        original_name: file?.originalname,
        originalName: file?.originalname,
        provider: storage.name,
      },
    };
  }

  async uploadStoryImages(files = []) {
    if (!files || files.length === 0) {
      return { success: true, data: [] };
    }

    if (files.length > MAX_STORY_IMAGES_COUNT) {
      const error = new Error(`Số lượng ảnh tải lên vượt quá giới hạn tối đa ${MAX_STORY_IMAGES_COUNT} ảnh cho mỗi lần upload`);
      error.status = 400;
      throw error;
    }

    for (const file of files) {
      if (file.size && file.size > MAX_FILE_SIZE) {
        const error = new Error(`Dung lượng file '${file.originalname || "ảnh"}' vượt quá giới hạn tối đa 20MB`);
        error.status = 413;
        throw error;
      }
    }

    const storage = getStorageProvider();
    const chars = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ";
    const result = [];
    const jobImages = [];

    for (const file of files) {
      const id = crypto.randomUUID();
      let randomStr = "";
      for (let i = 0; i < 8; i++) {
        randomStr += chars[crypto.randomInt(0, chars.length)];
      }
      const timestamp = Date.now();
      const filename = `${timestamp}_${file.size}_${randomStr}.jpg`;
      const path = storage.generatePath("stories", filename);
      const url = storage.getUrl(path);

      result.push({
        id,
        original_name: file.originalname,
        originalName: file.originalname,
        filename,
        path,
        url,
        provider: storage.name,
      });

      jobImages.push({
        id,
        filename,
        path,
        provider: storage.name,
        file: {
          originalname: file.originalname,
          mimetype: file.mimetype,
          buffer: file.buffer,
          size: file.size,
        },
      });
    }

    imageQueue.addJob_addStoryImages({ images: jobImages, quality: 80 });

    return { success: true, data: result };
  }
}

const uploadService = new UploadService();

export default uploadService;
