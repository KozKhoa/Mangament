import express from "express";
import multer from "multer";

import * as uploadController from "../controllers/Upload.Controller.js";

import { AuthorizationRole, AuthenticationToken } from "../middlewares/Auth.Middleware.js";

const MAX_FILE_SIZE = 20 * 1024 * 1024; // 20MB
export const MAX_STORY_IMAGES_COUNT = 50; // Tối đa 50 ảnh mỗi lượt upload

const fileFilter = (req, file, cb) => {
  if (file.mimetype && file.mimetype.startsWith("image/")) {
    cb(null, true);
  } else {
    const error = new Error("Chỉ cho phép tải lên file hình ảnh (JPEG, PNG, WEBP,...)");
    error.status = 400;
    cb(error, false);
  }
};

const uploadAvatar = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: MAX_FILE_SIZE,
    files: 1,
  },
  fileFilter,
});

const uploadStoryImages = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: MAX_FILE_SIZE,
    files: MAX_STORY_IMAGES_COUNT,
  },
  fileFilter,
});

const uploadRoute = express.Router();

/**
 * @openapi
 * tags:
 *   - name: Uploads
 *     description: File uploads (S3/local)
 *
 * /uploads/user/me/avatar:
 *   post:
 *     tags: [Uploads]
 *     security:
 *       - bearerAuth: []
 *     summary: Upload avatar for current user (tối đa 20MB)
 *     requestBody:
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               image:
 *                 type: string
 *                 format: binary
 *     responses:
 *       '200':
 *         description: Uploaded
 *       '400':
 *         description: Bad Request (Định dạng file không hợp lệ)
 *       '401':
 *         $ref: '#/components/responses/Unauthorized'
 *       '413':
 *         description: Payload Too Large (File vượt quá 20MB)
 *
 * /uploads/user/{userId}/avatar:
 *   post:
 *     tags: [Uploads]
 *     security:
 *       - bearerAuth: []
 *     summary: Upload avatar for a user (admin, tối đa 20MB)
 *     parameters:
 *       - name: userId
 *         in: path
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               image:
 *                 type: string
 *                 format: binary
 *     responses:
 *       '200':
 *         description: Uploaded
 *       '400':
 *         description: Bad Request
 *       '401':
 *         $ref: '#/components/responses/Unauthorized'
 *       '413':
 *         description: Payload Too Large (File vượt quá 20MB)
 *
 * /uploads/story/images:
 *   post:
 *     tags: [Uploads]
 *     security:
 *       - bearerAuth: []
 *     summary: Upload multiple images for story (admin, tối đa 50 ảnh/lần, mỗi ảnh tối đa 20MB)
 *     requestBody:
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               images:
 *                 type: array
 *                 items:
 *                   type: string
 *                   format: binary
 *     responses:
 *       '200':
 *         description: Uploaded
 *       '400':
 *         description: Bad Request (Vượt quá 50 ảnh hoặc định dạng không đúng)
 *       '401':
 *         $ref: '#/components/responses/Unauthorized'
 *       '413':
 *         description: Payload Too Large (File vượt quá 20MB)
 */

// Upload Avatar
uploadRoute.post("/user/me/avatar", AuthenticationToken, uploadAvatar.single("image"), uploadController.UploadAvatar);
uploadRoute.post("/user/:userId/avatar", AuthenticationToken, AuthorizationRole, uploadAvatar.single("image"), uploadController.UploadAvatar);

// Upload Story Images
uploadRoute.post(
  "/story/images",
  AuthenticationToken,
  AuthorizationRole,
  uploadStoryImages.array("images", MAX_STORY_IMAGES_COUNT),
  uploadController.UploadStoryImages,
);

export default uploadRoute;
