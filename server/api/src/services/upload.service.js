import * as imageService from "../services/image.service.js";

import sharp from "sharp";
import crypto from "crypto";

import r2CloudflareUtils from "../utils/R2Cloudflare.js";

class UploadService {
  async uploadAvatar(userId, file) {
    const id = crypto.randomUUID();

    const key = `user/${userId}/avatar/_avatar_${userId}_${id}.jpg`;

    const url = `${process.env.CDN_URL}/${key}`;

    // Resize + optimize
    const optimizedBuffer = await sharp(file.buffer)
      .resize({ width: 300 })
      .jpeg({
        quality: 80,
        mozjpeg: true,
      })
      .toBuffer();

    const result = await Promise.all([r2CloudflareUtils.uploadObject(key, optimizedBuffer, file.mimetype), imageService.AddImage({ url, key })]);
  }
}
