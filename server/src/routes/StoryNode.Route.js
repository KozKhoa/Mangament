import express from "express";
import multer from "multer";
import path from "path";

import {
  AuthenticationToken,
  AuthorizationRole,
} from "../middlewares/Auth.Middleware.js";
import {
  DeleteStoryNode,
  GetStoryNode,
  IncreaseOneViewForStoryNode,
  PatchStoryNodeContent,
  PostStoryNode,
  PutStoryNode,
} from "../controllers/StoryNode.Controller.js";
import {
  DeleteComment,
  GetAllComments,
  PostComment,
  PutComment,
} from "../controllers/Comment.Controller.js";

const saveLocation = "uploads/image";

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, saveLocation), // save location
  filename: (req, file, cb) => {
    cb(null, Date.now() + path.extname(file.originalname)); // file name
  },
});

const upload = multer({ storage: storage });

const storyNodeRoute = express.Router();

storyNodeRoute.get("/:id", GetStoryNode);
storyNodeRoute.post("/", AuthenticationToken, AuthorizationRole, PostStoryNode);
storyNodeRoute.put(
  "/:id",
  AuthenticationToken,
  AuthorizationRole,
  PutStoryNode
);
storyNodeRoute.patch(
  "/:id/content",
  AuthenticationToken,
  AuthorizationRole,
  upload.array("images", 200),
  PatchStoryNodeContent
);
storyNodeRoute.delete(
  "/:id",
  AuthenticationToken,
  AuthorizationRole,
  DeleteStoryNode
);
storyNodeRoute.patch("/:id/view", IncreaseOneViewForStoryNode);

// Comment
storyNodeRoute.get("/:storyNodeId/comments", GetAllComments);
storyNodeRoute.post("/:storyNodeId/comments", AuthenticationToken, PostComment);
storyNodeRoute.put("/comments/:id", AuthenticationToken, PutComment);
storyNodeRoute.delete("/comments/:id", AuthenticationToken, DeleteComment);
export default storyNodeRoute;
