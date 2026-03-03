import { PutObjectCommand } from "@aws-sdk/client-s3";
import crypto from "crypto";

import * as imageModel from "../models/Image.Model.js";

import pLimit from "p-limit";
import sharp from "sharp";

import { r2 } from "../configs/r2.js";

// POST /uploads/user/:userId/avatar
// POST /uploads/user/me/avatar
export async function UploadAvatar(req, res, next) {
  try {
    const userId = req.params?.userId ?? req.user.id;

    const file = req.file;

    const key = `user/${userId}/avatar/_avatar_${userId}.jpg`;

    const url = `${process.env.CDN_URL}/${key}`;

    // const existImage = await imageModel.FindImage({ url });
    // if (existImage.data) {
    //   return res.json({ success: true, data: { key: existImage.data.key, url: existImage.data.url, id: existImage.data.id } });
    // }

    // Resize + optimize
    const optimizedBuffer = await sharp(file.buffer)
      .resize({ width: 300 })
      .jpeg({
        quality: 80,
        mozjpeg: true,
      })
      .toBuffer();

    const result = await Promise.all([
      r2.send(
        new PutObjectCommand({
          Bucket: process.env.CLOUDFLARE_BUCKET,
          Key: key,
          Body: optimizedBuffer,
          ContentType: file.mimetype,
        }),
      ),

      imageModel.AddImage({ url, key }),
    ]);

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

    const key = `story/${storyId}/cover-art/_cover-art_${storyId}.jpg`;

    const url = `${process.env.CDN_URL}/${key}`;

    // const existImage = await imageModel.FindImage({ url });
    // if (existImage.data) {
    //   return res.json({ success: true, data: { key: existImage.data.key, url: existImage.data.url, id: existImage.data.id } });
    // }

    // Resize + optimize
    const optimizedBuffer = await sharp(file.buffer)
      .resize({ width: 800, withoutEnlargement: true })
      .jpeg({
        quality: 80,
        mozjpeg: true,
      })
      .toBuffer();

    const result = await Promise.all([
      r2.send(
        new PutObjectCommand({
          Bucket: process.env.CLOUDFLARE_BUCKET,
          Key: key,
          Body: optimizedBuffer,
          ContentType: file.mimetype,
        }),
      ),
      imageModel.AddImage({ url, key }),
    ]);

    res.json({ success: true, data: { key, url, id: result[1].data.id } });
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

    const limit = pLimit(3); // xử lý tối đa 3 ảnh cùng lúc

    const results = await Promise.all(
      files.map((file, index) =>
        limit(async () => {
          // const existImage = await imageModel.FindImage({ url });
          // if (existImage.data) {
          //   return { key: existImage.data.key, url: existImage.data.url, id: existImage.data.id };
          // }

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

          const result = await Promise.all([
            r2.send(
              new PutObjectCommand({
                Bucket: process.env.CLOUDFLARE_BUCKET,
                Key: key,
                Body: optimized,
                ContentType: "image/jpeg",
                CacheControl: "public, max-age=31536000, immutable",
              }),
            ),
            imageModel.AddImage({ url, key }),
          ]);

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

    // const existImage = await imageModel.FindImage({ url });
    // if (existImage.data) {
    //   return res.json({ success: true, data: { key: existImage.data.key, url: existImage.data.url, id: existImage.data.id } });
    // }

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

    const result = await Promise.all([
      r2.send(
        new PutObjectCommand({
          Bucket: process.env.CLOUDFLARE_BUCKET,
          Key: key,
          Body: optimized,
          ContentType: "image/jpeg",
          CacheControl: "public, max-age=31536000, immutable",
        }),
      ),
      imageModel.AddImage({ url, key }),
    ]);

    res.json({ success: true, data: { key, url, id: result[1].data.id } });
  } catch (err) {
    next(err);
  }
}
