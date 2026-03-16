import express from "express";

import * as favouriteController from "../controllers/Favourite.Controller.js";

import { AuthenticationToken } from "../middlewares/Auth.Middleware.js";

const favouriteRoute = express.Router();

favouriteRoute.get("/user/me", AuthenticationToken, favouriteController.GetAllFavouriteStories);

favouriteRoute.post("/story/:id", AuthenticationToken, favouriteController.AddNewFavouriteStory);

favouriteRoute.delete("/:id", AuthenticationToken, favouriteController.DeleteFavouriteStory);

export default favouriteRoute;
