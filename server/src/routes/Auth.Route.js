import express from "express";

import {
  Login,
  Logout,
  Refresh,
  Register,
} from "../controllers/Auth.Controller.js";

import { GetUser } from "../controllers/User.Controller.js";

import {
  AuthenticationToken,
  AuthorizationRole,
} from "../middlewares/Auth.Middleware.js";

const authRouter = express.Router();

authRouter.post("/register", Register);
authRouter.post("/login", Login);
authRouter.post("/logout", Logout);
authRouter.post("/refresh", Refresh);
authRouter.get("/me", AuthenticationToken, GetUser);

export default authRouter;
