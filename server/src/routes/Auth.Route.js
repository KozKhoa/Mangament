import express from "express";

import {
  Login,
  Logout,
  Refresh,
  Register,
} from "../controllers/Auth.Controller.js";

const authRouter = express.Router();

authRouter.post("/register", Register);
authRouter.post("/login", Login);
authRouter.post("/logout", Logout);
authRouter.post("/refresh", Refresh);

export default authRouter;
