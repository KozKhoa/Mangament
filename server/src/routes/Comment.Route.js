import express from "express";

import { DeleteComment, GetAllComments, PostComment, PutComment } from "../controllers/Comment.Controller.js";

import { AuthenticationToken } from "../middlewares/Auth.Middleware.js";

const commentRoute = express.Router();

commentRoute.get("/:storyId", GetAllComments);
commentRoute.get("/:storyId/:storyNodeId", GetAllComments);

commentRoute.post("/:storyId", AuthenticationToken, PostComment);
commentRoute.post("/:storyId/:storyNodeId", AuthenticationToken, PostComment);

commentRoute.put("/:id", AuthenticationToken, PutComment);

commentRoute.delete("/:id", AuthenticationToken, DeleteComment);

export default commentRoute;
