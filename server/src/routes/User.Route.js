import express from "express";

import {
  AuthorizationRole,
  AuthenticationToken,
} from "../middlewares/Auth.Middleware.js";

import {
  GetUserInfo,
  GetListUserInfo,
} from "../controllers/User.Controller.js";

const userRoute = express.Router();

userRoute.get("/get-user-info/:id", AuthenticationToken, GetUserInfo);
userRoute.get(
  "/get-list-user-info",
  AuthenticationToken,
  AuthorizationRole,
  GetListUserInfo
);

export default userRoute;
