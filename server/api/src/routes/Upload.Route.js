import express from "express";
import multer from "multer";

import * as uploadController from "../controllers/Upload.Controller.js";

import { AuthorizationRole, AuthenticationToken } from "../middlewares/Auth.Middleware.js";

const upload = multer();

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
 *     summary: Upload avatar for current user
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
 *       '401':
 *         $ref: '#/components/responses/Unauthorized'
 *
 * /uploads/user/{userId}/avatar:
 *   post:
 *     tags: [Uploads]
 *     security:
 *       - bearerAuth: []
 *     summary: Upload avatar for a user (admin)
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
 *       '401':
 *         $ref: '#/components/responses/Unauthorized'
 *
 * /uploads/story/{storyId}/cover-art:
 *   post:
 *     tags: [Uploads]
 *     security:
 *       - bearerAuth: []
 *     summary: Upload story cover art (admin)
 *     parameters:
 *       - name: storyId
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
 *       '401':
 *         $ref: '#/components/responses/Unauthorized'
 *
 * /uploads/story/{storyId}/story-node/{storyNodeId}/contents:
 *   post:
 *     tags: [Uploads]
 *     security:
 *       - bearerAuth: []
 *     summary: Upload multiple images for story node (admin)
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
 *       '401':
 *         $ref: '#/components/responses/Unauthorized'
 *
 * /uploads/story/{storyId}/story-node/{storyNodeId}/content:
 *   post:
 *     tags: [Uploads]
 *     security:
 *       - bearerAuth: []
 *     summary: Upload single image for story node (admin)
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
 *       '401':
 *         $ref: '#/components/responses/Unauthorized'
 */

// Upload Avatar
uploadRoute.post("/user/me/avatar", AuthenticationToken, upload.single("image"), uploadController.UploadAvatar);
uploadRoute.post("/user/:userId/avatar", AuthenticationToken, AuthorizationRole, upload.single("image"), uploadController.UploadAvatar);

// Upload cover art for story
uploadRoute.post("/story/:storyId/cover-art", AuthenticationToken, AuthorizationRole, upload.single("image"), uploadController.UploadStoryCoverArt);

// Upload many contents for certain story node
uploadRoute.post(
  "/story/:storyId/story-node/:storyNodeId/contents",
  AuthenticationToken,
  AuthorizationRole,
  upload.array("images"),
  uploadController.UploadManyContentsForStoryNode,
);

// Upload single content for certain story node
uploadRoute.post(
  "/story/:storyId/story-node/:storyNodeId/content",
  AuthenticationToken,
  AuthorizationRole,
  upload.single("image"),
  uploadController.UploadContentForStoryNode,
);

export default uploadRoute;
