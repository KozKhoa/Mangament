import express from "express";
import multer from "multer";
import path from "path";

import {
  AddOneViewForStory,
  GetAllStories,
  GetStory,
  PostStory,
  PutStory,
} from "../controllers/Story.Controller.js";

import { GetComments } from "../controllers/Story.Controller.js";
import {
  AuthenticationToken,
  AuthorizationRole,
} from "../middlewares/Auth.Middleware.js";

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

export default storyRoute;
