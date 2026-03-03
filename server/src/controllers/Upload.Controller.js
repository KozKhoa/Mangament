import { PutObjectCommand } from "@aws-sdk/client-s3";
import crypto from "crypto";

import pLimit from "p-limit";
import sharp from "sharp";

import { r2 } from "../configs/r2.js";
import { CreateError } from "../utils/ErrorHandle.js";

// POST /uploads/user/:userId/avatar
// POST /uploads/user/me/avatar
export async function UploadAvatar(req, res, next) {
  try {
    const userId = req.params?.userId ?? req.user.id;

    const file = req.file;

    const key = `user/${userId}/avatar/_avatar_${userId}.jpg`;

    // Resize + optimize
    const optimizedBuffer = await sharp(file.buffer)
      .resize({ width: 300 })
      .jpeg({
        quality: 80,
        mozjpeg: true,
      })
      .toBuffer();

    await r2.send(
      new PutObjectCommand({
        Bucket: process.env.CLOUDFLARE_BUCKET,
        Key: key,
        Body: optimizedBuffer,
        ContentType: file.mimetype,
      }),
    );

    res.json({
      success: true,
      data: { key, url: `${process.env.CDN_URL}/${key}` },
    });
  } catch (err) {
    next(err);
  }
}

//  POST /uploads/story/:storyId/cover-art
export async function UploadStoryCoverArt(req, res, next) {
  try {
    const file = req.file;

    const storyId = req.params?.storyId;

    const key = `story/${storyId}/cover-art/_cover-art_${storyId}.jpg`;

    // Resize + optimize
    const optimizedBuffer = await sharp(file.buffer)
      .resize({ width: 800, withoutEnlargement: true })
      .jpeg({
        quality: 80,
        mozjpeg: true,
      })
      .toBuffer();

    await r2.send(
      new PutObjectCommand({
        Bucket: process.env.CLOUDFLARE_BUCKET,
        Key: key,
        Body: optimizedBuffer,
        ContentType: file.mimetype,
      }),
    );

    res.json({
      success: true,
      data: { key, url: `${process.env.CDN_URL}/${key}` },
    });
  } catch (err) {
    next(err);
  }
}

// POST /uploads/story/:storyId/story-node/:storyNodeId/contents
export async function UploadManyContentsForStoryNode(req, res, next) {
  try {
    const userId = req.user?.id;

    const storyId = req.params.storyId;
    const storyNodeId = req.params.storyNodeId;

    const files = req.files;

    const orderIndexs = req.body?.orderIndexs ?? Array.from({ length: files.length }).map((_, i) => i);

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

          const key = `story/${storyId}/story-node/${storyNodeId}/${orderIndexs?.at(index) ?? crypto.randomUUID()}.jpg`;

          await r2.send(
            new PutObjectCommand({
              Bucket: process.env.CLOUDFLARE_BUCKET,
              Key: key,
              Body: optimized,
              ContentType: "image/jpeg",
              CacheControl: "public, max-age=31536000, immutable",
            }),
          );

          return { key, url: `${process.env.CDN_URL}/${key}` };
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
    const userId = req.user?.id;

    const storyId = req.params.storyId;
    const storyNodeId = req.params.storyNodeId;

    const file = req.file;

    const orderIndex = req.body?.orderIndex ?? crypto.randomUUID();

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

    await r2.send(
      new PutObjectCommand({
        Bucket: process.env.CLOUDFLARE_BUCKET,
        Key: key,
        Body: optimized,
        ContentType: "image/jpeg",
        CacheControl: "public, max-age=31536000, immutable",
      }),
    );

    res.json({ success: true, data: { key, url: `${process.env.CDN_URL}/${key}` } });
  } catch (err) {
    next(err);
  }
}
