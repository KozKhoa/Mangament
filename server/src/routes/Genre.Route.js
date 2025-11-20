import express from "express";

import { GetAllGenre } from "../controllers/Genre.Controller.js";

import {
  AuthenticationToken,
  AuthorizationRole,
} from "../middlewares/Auth.Middleware.js";

const genreRoute = express.Router();

genreRoute.get("/", GetAllGenre);

export default genreRoute;
