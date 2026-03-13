import express from "express";

import { AddOneViewForStory, GetAllStories, GetRandomStory, GetStory, GetStoryReview } from "../controllers/Story.Controller.js";

import { AuthenticationToken, OptionalAuth } from "../middlewares/Auth.Middleware.js";
import { DeleteRating, GetAllRatings, PostRating, PutRating } from "../controllers/Rating.Controller.js";

const storyRoute = express.Router();

// Story
/**
 * @openapi
 * tags:
 *   - name: Stories
 *     description: Story management and ratings
 *
 * /stories/random:
 *   get:
 *     tags: [Stories]
 *     summary: Get random story
 *     responses:
 *       '200':
 *         description: Story
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Story'
 *
 * /stories/{id}/review:
 *   get:
 *     tags: [Stories]
 *     summary: Get story review
 *     parameters:
 *       - name: id
 *         in: path
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       '200':
 *         description: Reviews
 *
 * /stories/{id}:
 *   get:
 *     tags: [Stories]
 *     summary: Get story by id
 *     parameters:
 *       - name: id
 *         in: path
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       '200':
 *         description: Story
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Story'
 *   patch:
 *     tags: [Stories]
 *     summary: Increase story view
 *     parameters:
 *       - name: id
 *         in: path
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       '200':
 *         description: View incremented
 *
 * /stories/title/{title}:
 *   get:
 *     tags: [Stories]
 *     summary: Search story by title
 *     parameters:
 *       - name: title
 *         in: path
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       '200':
 *         description: Story
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Story'
 *
 * /stories:
 *   get:
 *     tags: [Stories]
 *     summary: List stories
 *     responses:
 *       '200':
 *         description: List of stories with pagination
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
 *                     $ref: '#/components/schemas/Story'
 *                 pagination:
 *                   $ref: '#/components/schemas/Pagination'
 *   post:
 *     tags: [Stories]
 *     security:
 *       - bearerAuth: []
 *     summary: Create story (admin)
 *     requestBody:
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               coverArt:
 *                 type: string
 *                 format: binary
 *               title:
 *                 type: string
 *     responses:
 *       '200':
 *         description: Created story
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Story'
 *       '401':
 *         $ref: '#/components/responses/Unauthorized'
 *
 * /stories/{id}/ratings/count:
 *   get:
 *     tags: [Stories]
 *     summary: Get ratings count
 *     parameters:
 *       - name: id
 *         in: path
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       '200':
 *         description: Count
 *
 * /stories/{id}/ratings:
 *   get:
 *     tags: [Stories]
 *     summary: Get ratings list
 *     parameters:
 *       - name: id
 *         in: path
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       '200':
 *         description: List
 *
 * /stories/ratings/{id}:
 *   put:
 *     tags: [Stories]
 *     security:
 *       - bearerAuth: []
 *     summary: Update rating
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
 *     tags: [Stories]
 *     security:
 *       - bearerAuth: []
 *     summary: Delete rating
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
storyRoute.get("/random", OptionalAuth, GetRandomStory);

storyRoute.get("/:id/review", GetStoryReview);
storyRoute.get("/:id", OptionalAuth, GetStory);
storyRoute.get("/title/:title", OptionalAuth, GetStory);
storyRoute.get("/", OptionalAuth, GetAllStories);
storyRoute.patch("/:id/view", AddOneViewForStory);

// Rating
storyRoute.post("/:id/ratings", AuthenticationToken, PostRating);
storyRoute.get("/:id/ratings", GetAllRatings);
storyRoute.put("/ratings/:id", AuthenticationToken, PutRating);
storyRoute.delete("/ratings/:id", AuthenticationToken, DeleteRating);

export default storyRoute;
