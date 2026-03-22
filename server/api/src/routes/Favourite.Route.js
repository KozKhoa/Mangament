import express from "express";

import * as favouriteController from "../controllers/Favourite.Controller.js";

import { AuthenticationToken } from "../middlewares/Auth.Middleware.js";

const favouriteRoute = express.Router();

/**
 * @swagger
 * tags:
 *   name: Favourites
 *   description: API for managing user favourite stories
 */

/**
 * @swagger
 * /favourites/user/me:
 *   get:
 *     summary: Get all favourite stories of the current user
 *     tags: [Favourites]
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
 *         name: nation
 *         schema:
 *           type: string
 *         description: Comma-separated nation names
 *     responses:
 *       200:
 *         description: Getting favourite stories successfully
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
 *                     type: object
 *                     properties:
 *                       id:
 *                         type: string
 *                       user_id:
 *                         type: string
 *                       story_id:
 *                         type: string
 *                       created_at:
 *                         type: string
 *                         format: date-time
 *                       story:
 *                         $ref: '#/components/schemas/Story'
 *                 pagination:
 *                   $ref: '#/components/schemas/Pagination'
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 */
favouriteRoute.get("/user/me", AuthenticationToken, favouriteController.GetAllFavouriteStories);

/**
 * @swagger
 * /favourites/story/{id}:
 *   post:
 *     summary: Add a story to the user's favourites
 *     tags: [Favourites]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: The ID of the story to add to favourites
 *     responses:
 *       200:
 *         description: Add new favourite story successfully
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
 *                   $ref: '#/components/schemas/FavouriteStory'
 *       400:
 *         description: Bad request (e.g., missing storyId)
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 */
favouriteRoute.post("/story/:id", AuthenticationToken, favouriteController.AddNewFavouriteStory);

/**
 * @swagger
 * /favourites/{id}:
 *   delete:
 *     summary: Remove a story from the user's favourites
 *     tags: [Favourites]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: The ID of the favourite record to remove
 *     responses:
 *       200:
 *         description: Delete user favourite story successfully
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
 *         description: Bad request or permission denied
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 */
favouriteRoute.delete("/:id", AuthenticationToken, favouriteController.DeleteFavouriteStory);

export default favouriteRoute;
