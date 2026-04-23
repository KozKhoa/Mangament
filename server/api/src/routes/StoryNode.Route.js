import express from "express";

import { GetStoryNode, IncreaseOneViewForStoryNode } from "../controllers/StoryNode.Controller.js";
import { ValidateData } from "../middlewares/Validate.Middleware.js";
import storyNodeSchemas from "../schemas/story-node.schema.js";

const storyNodeRoute = express.Router();

/**
 * @openapi
 * tags:
 *   - name: StoryNodes
 *     description: Story nodes (chapters/content)
 *
 * /story-nodes/{id}:
 *   get:
 *     tags: [StoryNodes]
 *     summary: Get story node by id
 *     parameters:
 *       - name: id
 *         in: path
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       '200':
 *         description: Story node
 *   patch:
 *     tags: [StoryNodes]
 *     summary: Increase node view
 *     parameters:
 *       - name: id
 *         in: path
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       '200':
 *         description: View increased
 *   delete:
 *     tags: [StoryNodes]
 *     security:
 *       - bearerAuth: []
 *     summary: Delete node
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
 *
 * /story-nodes:
 *   post:
 *     tags: [StoryNodes]
 *     security:
 *       - bearerAuth: []
 *     summary: Create story node
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/StoryNode'
 *     responses:
 *       '200':
 *         description: Created
 *       '401':
 *         $ref: '#/components/responses/Unauthorized'
 *
 * /story-nodes/{id}/content:
 *   patch:
 *     tags: [StoryNodes]
 *     security:
 *       - bearerAuth: []
 *     summary: Update node content with images
 *     parameters:
 *       - name: id
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
 *               images:
 *                 type: array
 *                 items:
 *                   type: string
 *                   format: binary
 *     responses:
 *       '200':
 *         description: Updated
 *       '401':
 *         $ref: '#/components/responses/Unauthorized'
 */

storyNodeRoute.get("/:id", ValidateData(storyNodeSchemas.getStoryNode), GetStoryNode);
storyNodeRoute.patch("/:id/view", ValidateData(storyNodeSchemas.increaseView), IncreaseOneViewForStoryNode);

export default storyNodeRoute;
