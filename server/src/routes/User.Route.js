import express from "express";

import {
  AuthorizationRole,
  AuthenticationToken,
} from "../middlewares/Auth.Middleware.js";

import {
  GetUser,
  GetAllUsers,
  GetReadingHistory,
  PutUser,
} from "../controllers/User.Controller.js";

const userRoute = express.Router();

userRoute.get("/me", AuthenticationToken, GetUser);
userRoute.get("/:id", AuthenticationToken, AuthorizationRole, GetUser);

userRoute.put("/me", AuthenticationToken, PutUser);
userRoute.put("/:id", AuthenticationToken, AuthorizationRole, PutUser);

userRoute.get("/list/get", AuthenticationToken, AuthorizationRole, GetAllUsers);

userRoute.get(
  "/reading-history/list/get/:id",
  AuthenticationToken,
  GetReadingHistory
);

export default userRoute;
