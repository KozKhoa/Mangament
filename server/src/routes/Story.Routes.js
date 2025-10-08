import express from "express";

import {
  GetStoryInfo,
  GetListStory,
  GetStoryNodeInfo,
} from "../controllers/Story.Controller.js";

const storyRoute = express.Router();

storyRoute.get("/get-story-info/:id", GetStoryInfo);
storyRoute.get("/get-list-story", GetListStory);

storyRoute.get("/get-story-node-info/:id", GetStoryNodeInfo);

export default storyRoute;
