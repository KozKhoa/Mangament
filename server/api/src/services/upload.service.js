import crypto from "crypto";
import sharp from "sharp";

import imageQueue from "../../worker/queues/image.queue.js";
import { getStorageProvider } from "../storage/index.js";
import * as imageService from "./image.service.js";

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

    const buffer = file.buffer ? (Buffer.isBuffer(file.buffer) ? file.buffer : Buffer.from(file.buffer)) : null;
    if (buffer) {
      const existingImage = await imageService.FindExistingImageByBuffer(buffer);
      if (existingImage) {
        const storage = getStorageProvider(existingImage.provider);
        const url = storage.getUrl(existingImage.path);
        return {
          success: true,
          data: {
            id: existingImage.id,
            key: existingImage.path,
            path: existingImage.path,
            url,
            hash: existingImage.hash,
            original_name: file?.originalname,
            originalName: file?.originalname,
            provider: existingImage.provider,
          },
        };
      }
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

  async uploadStoryImage(file) {
    if (!file) {
      const error = new Error("Vui lòng tải lên file hình ảnh");
      error.status = 400;
      throw error;
    }

    if (file.size && file.size > MAX_FILE_SIZE) {
      const error = new Error("Dung lượng ảnh vượt quá giới hạn tối đa 20MB");
      error.status = 413;
      throw error;
    }

    const buffer = file.buffer ? (Buffer.isBuffer(file.buffer) ? file.buffer : Buffer.from(file.buffer)) : null;
    if (!buffer) {
      const error = new Error("File buffer không hợp lệ");
      error.status = 400;
      throw error;
    }

    const hash = imageService.CalculateImageHash(buffer);
    const existingImage = await imageService.FindExistingImageByHash(hash);

    if (existingImage) {
      const storage = getStorageProvider(existingImage.provider);
      const url = storage.getUrl(existingImage.path);
      return {
        success: true,
        data: {
          id: existingImage.id,
          path: existingImage.path,
          key: existingImage.path,
          url: url,
          hash: existingImage.hash,
          provider: existingImage.provider,
          mine_type: existingImage.mine_type,
          width: existingImage.width,
          height: existingImage.height,
          size: existingImage.size,
          original_name: file.originalname,
          originalName: file.originalname,
        },
      };
    }

    const storage = getStorageProvider();
    const id = crypto.randomUUID();
    const chars = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ";
    let randomStr = "";
    for (let i = 0; i < 8; i++) {
      randomStr += chars[crypto.randomInt(0, chars.length)];
    }
    const timestamp = Date.now();
    const filename = `${timestamp}_${file.size || 0}_${randomStr}.jpg`;
    const path = storage.generatePath("stories", filename);
    const url = storage.getUrl(path);

    const imageSharp = sharp(buffer);
    const metadata = await imageSharp.metadata();

    const optimizedBuffer = await sharp(buffer)
      .jpeg({
        quality: 80,
        mozjpeg: true,
      })
      .toBuffer();

    await storage.upload(path, optimizedBuffer, "image/jpeg");

    const image = (
      await imageService.UpsertImage({
        id,
        provider: storage.name,
        mine_type: "image/jpeg",
        size: optimizedBuffer.length,
        path,
        width: metadata.width || null,
        height: metadata.height || null,
        hash,
        metadata: {
          original_name: file.originalname,
        },
      })
    ).data;

    return {
      success: true,
      data: {
        id: image.id,
        path: image.path,
        key: image.path,
        url: url,
        hash: image.hash,
        provider: image.provider,
        mine_type: image.mine_type,
        width: image.width,
        height: image.height,
        size: image.size,
        original_name: file.originalname,
        originalName: file.originalname,
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
      const buffer = file.buffer ? (Buffer.isBuffer(file.buffer) ? file.buffer : Buffer.from(file.buffer)) : null;
      let hash = null;
      if (buffer) {
        hash = imageService.CalculateImageHash(buffer);
        const existingImage = await imageService.FindExistingImageByHash(hash);
        if (existingImage) {
          const imgStorage = getStorageProvider(existingImage.provider);
          result.push({
            id: existingImage.id,
            original_name: file.originalname,
            originalName: file.originalname,
            filename: existingImage.path,
            path: existingImage.path,
            url: imgStorage.getUrl(existingImage.path),
            hash: existingImage.hash,
            provider: existingImage.provider,
          });
          continue;
        }
      }

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
        hash,
        provider: storage.name,
      });

      jobImages.push({
        id,
        hash,
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

    if (jobImages.length > 0) {
      imageQueue.addJob_addStoryImages({ images: jobImages, quality: 80 });
    }

    return { success: true, data: result };
  }
}

const uploadService = new UploadService();

export default uploadService;
