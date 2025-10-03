import express from "express";

import { GetStoryInfo, GetListStory } from "../controllers/Story.Controller.js";

const storyRoute = express.Router();

storyRoute.get("/get-story-info/:id", GetStoryInfo);
storyRoute.get("/get-list-story", GetListStory);

export default storyRoute;
