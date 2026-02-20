import express from "express";

import { DeleteComment, GetAllComments, PostComment, PutComment } from "../controllers/Comment.Controller.js";

import { AuthenticationToken } from "../middlewares/Auth.Middleware.js";

const commentRoute = express.Router();

commentRoute.get("/story/:storyId", GetAllComments);
commentRoute.get("/story/:storyId/story-node/:storyNodeId", GetAllComments);

commentRoute.post("/story/:storyId", AuthenticationToken, PostComment);
commentRoute.post("/story/:storyId/story-node/:storyNodeId", AuthenticationToken, PostComment);

commentRoute.put("/:id", AuthenticationToken, PutComment);

commentRoute.delete("/:id", AuthenticationToken, DeleteComment);

export default commentRoute;
