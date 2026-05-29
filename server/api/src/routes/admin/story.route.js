import express from "express";

import { ValidateData } from "../../middlewares/Validate.Middleware.js";
import adminSchemas from "../../schemas/admin.schemas.js";

import adminController from "../../controllers/admin/index.js";

const adminStoryRoute = express.Router();

adminStoryRoute.get("/", ValidateData(adminSchemas.getAllStories), adminController.story.getAllStories);

adminStoryRoute.get("/trash", ValidateData(adminSchemas.getAllTrashStories), adminController.story.getAllTrashStories);

adminStoryRoute.get("/:id", ValidateData(adminSchemas.getStory), adminController.story.getStory);

adminStoryRoute.post("/", ValidateData(adminSchemas.postStory), adminController.story.postNewStory);

adminStoryRoute.patch("/:id/cover-art", ValidateData(adminSchemas.updateStoryCoverArt), adminController.story.updateStoryCoverArt);

adminStoryRoute.put("/:id", ValidateData(adminSchemas.updateStory), adminController.story.updateStory);

adminStoryRoute.patch("/:id/active", ValidateData(adminSchemas.toggleActiveStory), adminController.story.toggleActiveStory);

adminStoryRoute.delete("/trash", ValidateData(adminSchemas.deleteManyTrashStories), adminController.story.deleteManyTrashStories);

adminStoryRoute.delete("/:id", ValidateData(adminSchemas.deleteStory), adminController.story.deleteStory);

adminStoryRoute.delete("/trash/:id", ValidateData(adminSchemas.deleteTrashStory), adminController.story.deleteTrashStory);

adminStoryRoute.patch("/trash/restore", ValidateData(adminSchemas.restoreManyTrashStories), adminController.story.restoreManyTrashStories);

adminStoryRoute.patch("/trash/:id/restore", ValidateData(adminSchemas.restoreTrashStory), adminController.story.restoreTrashStory);

export default adminStoryRoute;
