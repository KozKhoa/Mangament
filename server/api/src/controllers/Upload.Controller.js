import crypto from "crypto";

import * as imageService from "../services/image.service.js";

import pLimit from "p-limit";
import sharp from "sharp";

import r2CloudflareUtils from "../utils/R2Cloudflare.js";
import uploadService from "../services/upload.service.js";

// POST /uploads/user/:userId/avatar
// POST /uploads/user/me/avatar
export async function UploadAvatar(req, res, next) {
  try {
    const userId = req.params?.userId ?? req.user.id;

    const file = req.file;

    const avatar = (await uploadService.uploadAvatar(userId, file)).data;

    res.json({ success: true, data: avatar });
  } catch (err) {
    next(err);
  }
}

//  POST /uploads/story/:storyId/cover-art
export async function UploadStoryCoverArt(req, res, next) {
  try {
    const file = req.file;

    const storyId = req.params?.storyId;

    const coverArt = (await uploadService.uploadStoryCoverArt(storyId, file)).data;

    res.json({ success: true, data: coverArt });
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

    const contents = (await uploadService.uploadManyContentsForStoryNode(storyId, storyNodeId, files)).data;

    res.json({ success: true, data: contents });
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

    const content = (await uploadService.uploadContentForStoryNode(storyId, storyNodeId, file)).data;

    res.json({ success: true, data: content });
  } catch (err) {
    next(err);
  }
}
