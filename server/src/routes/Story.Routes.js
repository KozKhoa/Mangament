import express from "express";
import multer from "multer";
import path from "path";

import {
  AddOneViewForStory,
  DeleteStory,
  GetAllStories,
  GetCountStories,
  GetRandomStory,
  GetStory,
  GetStoryReview,
  PostStory,
  PutStory,
} from "../controllers/Story.Controller.js";

import { AuthenticationToken, AuthorizationRole, OptionalAuth } from "../middlewares/Auth.Middleware.js";
import { DeleteComment, GetAllComments, GetCountComment, PostComment, PutComment } from "../controllers/Comment.Controller.js";
import { DeleteRating, GetAllRatings, GetCountRating, PostRating, PutRating } from "../controllers/Rating.Controller.js";

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
storyRoute.get("/random", OptionalAuth, GetRandomStory);
storyRoute.get("/count", GetCountStories);
storyRoute.get("/:id/review", GetStoryReview);
storyRoute.get("/:id", OptionalAuth, GetStory);
storyRoute.get("/title/:title", OptionalAuth, GetStory);
storyRoute.get("/", OptionalAuth, GetAllStories);
storyRoute.patch("/:id/view", AddOneViewForStory);
storyRoute.post("/", AuthenticationToken, AuthorizationRole, upload.single("coverArt"), PostStory); // coverArt is the image for the cover art of the story
storyRoute.put("/:id", AuthenticationToken, AuthorizationRole, PutStory);
storyRoute.delete("/:id", AuthenticationToken, AuthorizationRole, DeleteStory);

// Comment
storyRoute.post("/:storyId/comments", AuthenticationToken, PostComment);
storyRoute.get("/:storyId/comments/count", GetCountComment);
storyRoute.get("/:storyId/comments", GetAllComments);
storyRoute.put("/comments/:id", AuthenticationToken, PutComment);
storyRoute.delete("/comments/:id", AuthenticationToken, DeleteComment);

// Rating
storyRoute.post("/:id/ratings", AuthenticationToken, PostRating);
storyRoute.get("/:id/ratings/count", GetCountRating);
storyRoute.get("/:id/ratings", GetAllRatings);
storyRoute.put("/ratings/:id", AuthenticationToken, PutRating);
storyRoute.delete("/ratings/:id", AuthenticationToken, DeleteRating);

export default storyRoute;
