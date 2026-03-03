import express from "express";
import multer from "multer";
import path from "path";

import { PutObjectCommand } from "@aws-sdk/client-s3";

import * as uploadController from "../controllers/Upload.Controller.js";
import crypto from "crypto";

import { S3Client } from "@aws-sdk/client-s3";

import { AuthorizationRole, AuthenticationToken } from "../middlewares/Auth.Middleware.js";

const upload = multer();

const uploadRoute = express.Router();

uploadRoute.post("/user/:userId/avatar", AuthenticationToken, AuthorizationRole, upload.single("image"), uploadController.UploadAvatar);

uploadRoute.post("/story/:storyId/cover-art", AuthenticationToken, AuthorizationRole, upload.single("image"), uploadController.UploadStoryCoverArt);

uploadRoute.post(
  "/story/:storyId/story-node/:storyNodeId/contents",
  AuthenticationToken,
  AuthorizationRole,
  upload.array("images"),
  uploadController.UploadManyContentsForStoryNode,
);

uploadRoute.post(
  "/story/:storyId/story-node/:storyNodeId/content",
  AuthenticationToken,
  AuthorizationRole,
  upload.single("image"),
  uploadController.UploadContentForStoryNode,
);

export default uploadRoute;
