import express from "express";

import { DeleteComment, GetAllComments, PostComment, PutComment } from "../controllers/Comment.Controller.js";

import { AuthenticationToken } from "../middlewares/Auth.Middleware.js";

const commentRoute = express.Router();

/**
 * @openapi
 * tags:
 *   - name: Comments
 *     description: Commenting on stories and nodes
 *
 * /comments/story/{storyId}:
 *   get:
 *     tags: [Comments]
 *     summary: Get comments for a story
 *     parameters:
 *       - name: storyId
 *         in: path
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       '200':
 *         description: List
 *   post:
 *     tags: [Comments]
 *     security:
 *       - bearerAuth: []
 *     summary: Post comment on a story
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               content:
 *                 type: string
 *               parentCommentId:
 *                 type: string
 *     responses:
 *       '200':
 *         description: Created
 *       '401':
 *         $ref: '#/components/responses/Unauthorized'
 *
 * /comments/story/{storyId}/story-node/{storyNodeId}:
 *   get:
 *     tags: [Comments]
 *     summary: Get comments for a story node
 *     parameters:
 *       - name: storyId
 *         in: path
 *         required: true
 *         schema:
 *           type: string
 *       - name: storyNodeId
 *         in: path
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       '200':
 *         description: List
 *   post:
 *     tags: [Comments]
 *     security:
 *       - bearerAuth: []
 *     summary: Post comment on a story node
 *     responses:
 *       '200':
 *         description: Created
 *       '401':
 *         $ref: '#/components/responses/Unauthorized'
 *
 * /comments/{id}:
 *   put:
 *     tags: [Comments]
 *     security:
 *       - bearerAuth: []
 *     summary: Update a comment
 *     parameters:
 *       - name: id
 *         in: path
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       '200':
 *         description: Updated
 *       '401':
 *         $ref: '#/components/responses/Unauthorized'
 *   delete:
 *     tags: [Comments]
 *     security:
 *       - bearerAuth: []
 *     summary: Delete a comment
 *     parameters:
 *       - name: id
 *         in: path
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       '200':
 *         description: Deleted
 *       '401':
 *         $ref: '#/components/responses/Unauthorized'
 */

commentRoute.get("/story/:storyId", GetAllComments);
commentRoute.get("/story/:storyId/story-node/:storyNodeId", GetAllComments);

commentRoute.post("/story/:storyId", AuthenticationToken, PostComment);
commentRoute.post("/story/:storyId/story-node/:storyNodeId", AuthenticationToken, PostComment);

commentRoute.put("/:id", AuthenticationToken, PutComment);

commentRoute.delete("/:id", AuthenticationToken, DeleteComment);

export default commentRoute;
