import express from "express";

import { AuthenticationToken, AuthorizationRole } from "../middlewares/Auth.Middleware.js";

import * as cloudinaryController from "../controllers/Cloudinary.Controller.js";

const cloudinaryRoute = express.Router();

cloudinaryRoute.use(AuthenticationToken);

/**
 * @openapi
 * tags:
 *   - name: Cloudinary
 *     description: Cloudinary upload signatures
 *
 * /cloudinary/signature/story/{storyId}/cover-art:
 *   get:
 *     tags: [Cloudinary]
 *     security:
 *       - bearerAuth: []
 *     summary: Create signature for story cover upload
 *     parameters:
 *       - name: storyId
 *         in: path
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       '200':
 *         description: Signature
 *       '401':
 *         $ref: '#/components/responses/Unauthorized'
 *
 * /cloudinary/signature/storyType/{storyType}/storyTitle/{storyTitle}/cover-art:
 *   get:
 *     tags: [Cloudinary]
 *     security:
 *       - bearerAuth: []
 *     summary: Create signature by story type and title
 *     responses:
 *       '200':
 *         description: Signature
 *       '401':
 *         $ref: '#/components/responses/Unauthorized'
 *
 * /cloudinary/signature/story-node/{storyNodeId}/content:
 *   get:
 *     tags: [Cloudinary]
 *     security:
 *       - bearerAuth: []
 *     summary: Create signature for story-node content upload
 *     parameters:
 *       - name: storyNodeId
 *         in: path
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       '200':
 *         description: Signature
 *       '401':
 *         $ref: '#/components/responses/Unauthorized'
 */

cloudinaryRoute.get("/signature/story/:storyId/cover-art", AuthorizationRole, cloudinaryController.CreateSignatureForUploadStoryCoverArt);
cloudinaryRoute.get(
  "/signature/storyType/:storyType/storyTitle/:storyTitle/cover-art",
  AuthorizationRole,
  cloudinaryController.CreateSignatureForUploadStoryCoverArt,
);
cloudinaryRoute.get("/signature/story-node/:storyNodeId/content", AuthorizationRole, cloudinaryController.CreateSignatureForUploadStoryNodeContent);

export default cloudinaryRoute;
