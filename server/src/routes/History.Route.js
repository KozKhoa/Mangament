import express from "express";

import * as historyController from "../controllers/History.Controller.js";

import { AuthenticationToken } from "../middlewares/Auth.Middleware.js";

const historyRoute = express.Router();

/**
 * @swagger
 * tags:
 *   name: Histories
 *   description: API for managing user reading history
 */

/**
 * @swagger
 * /histories/user/me:
 *   get:
 *     summary: Get all reading histories of the current user
 *     tags: [Histories]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 100
 *         description: Number of items per page
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *         description: Page number
 *       - in: query
 *         name: sort
 *         schema:
 *           type: string
 *           example: "created_at:desc"
 *         description: Sorting field and direction (field:direction)
 *       - in: query
 *         name: type
 *         schema:
 *           type: string
 *         description: Comma-separated story types
 *       - in: query
 *         name: author
 *         schema:
 *           type: string
 *         description: Comma-separated author IDs
 *       - in: query
 *         name: genre
 *         schema:
 *           type: string
 *         description: Comma-separated genre names
 *       - in: query
 *         name: star
 *         schema:
 *           type: string
 *           example: "4-5"
 *         description: Star range
 *       - in: query
 *         name: view
 *         schema:
 *           type: string
 *           example: "0-1000"
 *         description: View range
 *       - in: query
 *         name: fromDate
 *         schema:
 *           type: string
 *           format: date
 *         description: Filter by start date (YYYY-MM-DD)
 *       - in: query
 *         name: toDate
 *         schema:
 *           type: string
 *           format: date
 *         description: Filter by end date (YYYY-MM-DD)
 *     responses:
 *       200:
 *         description: Get reading history successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 message:
 *                   type: string
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/ReadingHistory'
 *                 pagination:
 *                   $ref: '#/components/schemas/Pagination'
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 */
historyRoute.get("/user/me", AuthenticationToken, historyController.GetAllReadingHistories);

/**
 * @swagger
 * /histories/story/{storyId}/story-node/{storyNodeId}:
 *   post:
 *     summary: Add a new reading history entry
 *     tags: [Histories]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: storyId
 *         required: true
 *         schema:
 *           type: string
 *         description: The ID of the story being read
 *       - in: path
 *         name: storyNodeId
 *         required: true
 *         schema:
 *           type: string
 *         description: The ID of the story node (chapter/arc/volume) being read
 *     responses:
 *       200:
 *         description: Adding reading history successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 message:
 *                   type: string
 *                 data:
 *                   type: object
 *                   properties:
 *                     history:
 *                       type: object
 *                       properties:
 *                         id: { type: string }
 *                     user:
 *                       type: object
 *                       properties:
 *                         id: { type: string }
 *                     story:
 *                       type: object
 *                       properties:
 *                         id: { type: string }
 *                     story_node:
 *                       type: object
 *                       properties:
 *                         id: { type: string }
 *                     created_at:
 *                       type: string
 *                       format: date-time
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 */
historyRoute.post("/story/:storyId/story-node/:storyNodeId", AuthenticationToken, historyController.AddNewReadingHistory);

/**
 * @swagger
 * /histories/{id}:
 *   delete:
 *     summary: Delete a reading history entry
 *     tags: [Histories]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: The ID of the reading history entry to remove
 *     responses:
 *       200:
 *         description: Delete reading history successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 message:
 *                   type: string
 *       400:
 *         description: Bad request (e.g., missing historyId)
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 */
historyRoute.delete("/:id", AuthenticationToken, historyController.DeleteReadingHistory);

export default historyRoute;
