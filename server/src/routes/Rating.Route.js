import express from "express";

import * as ratingController from "../controllers/Rating.Controller.js";

import { AuthenticationToken } from "../middlewares/Auth.Middleware.js";

const ratingRoute = express.Router();

// Rating
ratingRoute.get("/story/:id", ratingController.GetAllRatings);

ratingRoute.post("/story/:id", AuthenticationToken, ratingController.PostRating);

ratingRoute.put("/:id", AuthenticationToken, ratingController.PutRating);

ratingRoute.delete("/:id", AuthenticationToken, ratingController.DeleteRating);

export default ratingRoute;
