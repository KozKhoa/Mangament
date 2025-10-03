import express from "express";

import AuthorizationMiddleware from "../middlewares/Auth.Middleware.js";

import { GetUserInfo } from "../controllers/User.Controller.js";

const userRoute = express.Router();

userRoute.get("/get-user-info/:id", AuthorizationMiddleware, GetUserInfo);

export default userRoute;
