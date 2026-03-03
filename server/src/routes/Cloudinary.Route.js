import express from "express";

import { AuthenticationToken, AuthorizationRole } from "../middlewares/Auth.Middleware.js";

import * as cloudinaryController from "../controllers/Cloudinary.Controller.js";

const cloudinaryRoute = express.Router();

cloudinaryRoute.use(AuthenticationToken);

cloudinaryRoute.get("/signature/story/:storyId/cover-art", AuthorizationRole, cloudinaryController.CreateSignatureForUploadStoryCoverArt);
cloudinaryRoute.get(
  "/signature/storyType/:storyType/storyTitle/:storyTitle/cover-art",
  AuthorizationRole,
  cloudinaryController.CreateSignatureForUploadStoryCoverArt,
);
cloudinaryRoute.get("/signature/story-node/:storyNodeId/content", AuthorizationRole, cloudinaryController.CreateSignatureForUploadStoryNodeContent);

export default cloudinaryRoute;
