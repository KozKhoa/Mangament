import express from "express";

import * as genreController from "../controllers/Genre.Controller.js";

const genreRoute = express.Router();

/**
 * @openapi
 * tags:
 *   - name: Genres
 *     description: Genre listing
 *
 * /genres:
 *   get:
 *     tags: [Genres]
 *     summary: List genres
 *     responses:
 *       '200':
 *         description: List
 */

genreRoute.get("/", genreController.GetAllGenres);

genreRoute.get("/trending", genreController.GetTrendingGenres);

export default genreRoute;
