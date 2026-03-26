import crypto from "crypto";

import * as imageService from "../services/image.service.js";

import pLimit from "p-limit";
import sharp from "sharp";

import r2CloudflareUtils from "../utils/R2Cloudflare.js";

// POST /uploads/user/:userId/avatar
// POST /uploads/user/me/avatar
export async function UploadAvatar(req, res, next) {
  try {
    const userId = req.params?.userId ?? req.user.id;

    const file = req.file;

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

    res.json({ success: true, data: { key, url, id: result[1].data.id } });
  } catch (err) {
    next(err);
  }
}

//  POST /uploads/story/:storyId/cover-art
export async function UploadStoryCoverArt(req, res, next) {
  try {
    const file = req.file;

    const storyId = req.params?.storyId;

    const id = crypto.randomUUID();

    const key = `story/${storyId}/cover-art/_cover-art_${storyId}_${id}.jpg`;

    const url = `${process.env.CDN_URL}/${key}`;

    // Resize + optimize
    const optimizedBuffer = await sharp(file.buffer)
      .resize({ width: 800, withoutEnlargement: true })
      .jpeg({
        quality: 80,
        mozjpeg: true,
      })
      .toBuffer();

    const result = await Promise.all([r2CloudflareUtils.uploadObject(key, optimizedBuffer, file.mimetype), imageService.AddImage({ url, key })]);

    res.json({ success: true, data: { key, url, id: result[1].data.id } });
  } catch (err) {
    next(err);
  }
}

// POST /uploads/story/:storyId/story-node/:storyNodeId/contents
export async function UploadManyContentsForStoryNode(req, res, next) {
  try {
    const storyId = req.params.storyId;
    const storyNodeId = req.params.storyNodeId;

    const files = req.files;

    const limit = pLimit(3); // xử lý tối đa 3 ảnh cùng lúc

    const results = await Promise.all(
      files.map((file, index) =>
        limit(async () => {
          const optimized = await sharp(file.buffer)
            .resize({
              width: 1200,
              withoutEnlargement: true,
            })
            .jpeg({
              quality: 80,
              mozjpeg: true,
            })
            .toBuffer();

          const key = `story/${storyId}/story-node/${storyNodeId}/${crypto.randomUUID()}.jpg`;
          const url = `${process.env.CDN_URL}/${key}`;

          const result = await Promise.all([r2CloudflareUtils.uploadObject(key, optimized, "image/jpeg"), imageService.AddImage({ url, key })]);

          return { key, url, id: result[1].data.id };
        }),
      ),
    );

    res.json({ success: true, data: results });
  } catch (err) {
    next(err);
  }
}

// POST /uploads/story/:storyId/story-node/:storyNodeId/content
export async function UploadContentForStoryNode(req, res, next) {
  try {
    const storyId = req.params.storyId;
    const storyNodeId = req.params.storyNodeId;

    const file = req.file;

    const key = `story/${storyId}/story-node/${storyNodeId}/${crypto.randomUUID()}.jpg`;
    const url = `${process.env.CDN_URL}/${key}`;

    const optimized = await sharp(file.buffer)
      .resize({
        width: 1200,
        withoutEnlargement: true,
      })
      .jpeg({
        quality: 80,
        mozjpeg: true,
      })
      .toBuffer();

    const result = await Promise.all([r2CloudflareUtils.uploadObject(key, optimized, "image/jpeg"), imageService.AddImage({ url, key })]);

    res.json({ success: true, data: { key, url, id: result[1].data.id } });
  } catch (err) {
    next(err);
  }
}
