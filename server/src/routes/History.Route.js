import express from "express";

import * as historyController from "../controllers/History.Controller.js";

import { AuthenticationToken } from "../middlewares/Auth.Middleware.js";

const historyRoute = express.Router();

historyRoute.get("/user/me", AuthenticationToken, historyController.GetAllReadingHistories);

historyRoute.post("/story/:storyId/story-node/:storyNodeId", AuthenticationToken, historyController.AddNewReadingHistory);

historyRoute.delete("/:id", AuthenticationToken, historyController.DeleteReadingHistory);

export default historyRoute;
