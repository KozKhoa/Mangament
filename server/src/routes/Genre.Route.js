import express from "express";

import { GetAllGenre } from "../controllers/Genre.Controller.js";

import { AuthenticationToken, AuthorizationRole } from "../middlewares/Auth.Middleware.js";

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

genreRoute.get("/", GetAllGenre);

export default genreRoute;
