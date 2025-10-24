import express from "express";
import multer from "multer";
import path from "path";

import {
  AddOneViewForStory,
  DeleteStory,
  GetAllStories,
  GetStory,
  PostStory,
  PutStory,
} from "../controllers/Story.Controller.js";

import {
  AuthenticationToken,
  AuthorizationRole,
} from "../middlewares/Auth.Middleware.js";
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

const storyRoute = express.Router();

// Story
storyRoute.get("/:id", GetStory);
storyRoute.get("/", GetAllStories);
storyRoute.patch("/:id/view", AddOneViewForStory);
storyRoute.post(
  "/",
  AuthenticationToken,
  AuthorizationRole,
  upload.single("coverArt"),
  PostStory
); // coverArt is the image for the cover art of the story
storyRoute.put(
  "/:id",
  AuthenticationToken,
  AuthorizationRole,
  upload.single("coverArt"),
  PutStory
);
storyRoute.delete("/:id", AuthenticationToken, AuthorizationRole, DeleteStory);

// Comment
storyRoute.post("/:storyId/comments", AuthenticationToken, PostComment);
storyRoute.get("/:storyId/comments", GetAllComments);
storyRoute.put("/comments/:id", AuthenticationToken, PutComment);
storyRoute.delete("/comments/:id", AuthenticationToken, DeleteComment);

// Rating
storyRoute.post("/:storyId/ratings", AuthenticationToken);

export default storyRoute;
