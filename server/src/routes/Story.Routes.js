import express from "express";

import {
  GetStoryInfo,
  GetListStory,
  GetStoryNodeInfo,
} from "../controllers/Story.Controller.js";

import { GetComments } from "../controllers/Story.Controller.js";

const storyRoute = express.Router();

storyRoute.get("/get-story/:id", GetStoryInfo);
storyRoute.get("/get-list-story", GetListStory);

storyRoute.get("/get-story-node/:id", GetStoryNodeInfo);

storyRoute.get("/get-list-comment/:storyId", GetComments);

export default storyRoute;
