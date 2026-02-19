import express from "express";

import { AuthenticationToken, AuthorizationRole } from "../middlewares/Auth.Middleware.js";

import * as cloudinaryController from "../controllers/Cloudinary.Controller.js";

const cloudinaryRoute = express.Router();

cloudinaryRoute.use(AuthenticationToken);

cloudinaryRoute.get("/signature/:storyId/cover-art", AuthorizationRole, cloudinaryController.CreateSignatureForUploadStoryCoverArt);

export default cloudinaryRoute;
