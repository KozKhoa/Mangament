import express from "express";

import * as ratingController from "../controllers/Rating.Controller.js";

import { AuthenticationToken } from "../middlewares/Auth.Middleware.js";
import { ValidateData } from "../middlewares/Validate.Middleware.js";
import ratingSchemas from "../schemas/rating.schemas.js";

const ratingRoute = express.Router();

/**
 * @swagger
 * tags:
 *   name: Ratings
 *   description: API for managing story ratings
 */

/**
 * @swagger
 * /ratings/story/{id}:
 *   get:
 *     summary: Get all ratings for a specific story
 *     tags: [Ratings]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: The ID of the story to get ratings for
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 10
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *       - in: query
 *         name: star
 *         schema:
 *           type: string
 *           example: "4-5"
 *         description: Filter by star range
 *       - in: query
 *         name: sort
 *         schema:
 *           type: string
 *           example: "updated_at:desc"
 *     responses:
 *       200:
 *         description: Getting all ratings successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success: { type: boolean }
 *                 message: { type: string }
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Rating'
 *                 pagination:
 *                   $ref: '#/components/schemas/Pagination'
 */
ratingRoute.get("/story/:id", ValidateData(ratingSchemas.getAllRatings), ratingController.GetAllRatings);

/**
 * @swagger
 * /ratings/story/{id}:
 *   post:
 *     summary: Add a new rating for a story
 *     tags: [Ratings]
 *     security:
 *       - bearerAuth: []
 *       - apiKeyAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: The ID of the story to rate
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [star, title, content]
 *             properties:
 *               star:
 *                 type: integer
 *                 minimum: 1
 *                 maximum: 5
 *               title:
 *                 type: string
 *                 maxLength: 100
 *               content:
 *                 type: string
 *     responses:
 *       200:
 *         description: Add new rating successfully
 */
ratingRoute.post("/story/:id", AuthenticationToken, ValidateData(ratingSchemas.postRating), ratingController.PostRating);

/**
 * @swagger
 * /ratings/{id}:
 *   put:
 *     summary: Update an existing rating
 *     tags: [Ratings]
 *     security:
 *       - bearerAuth: []
 *       - apiKeyAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: The ID of the rating to update
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               star:
 *                 type: integer
 *                 minimum: 1
 *                 maximum: 5
 *               title:
 *                 type: string
 *               content:
 *                 type: string
 *     responses:
 *       200:
 *         description: Update rating successfully
 */
ratingRoute.put("/:id", AuthenticationToken, ValidateData(ratingSchemas.putRating), ratingController.PutRating);

/**
 * @swagger
 * /ratings/{id}:
 *   delete:
 *     summary: Delete a rating
 *     tags: [Ratings]
 *     security:
 *       - bearerAuth: []
 *       - apiKeyAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: The ID of the rating to delete
 *     responses:
 *       200:
 *         description: Delete rating successfully
 */
ratingRoute.delete("/:id", AuthenticationToken, ValidateData(ratingSchemas.deleteRating), ratingController.DeleteRating);

export default ratingRoute;
