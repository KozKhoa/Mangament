import express from "express";

import { ForgotPassword, Login, Logout, Refresh, Register, ResetPassword } from "../controllers/Auth.Controller.js";

import { GetUser } from "../controllers/User.Controller.js";

import { AuthenticationToken, AuthorizationRole } from "../middlewares/Auth.Middleware.js";

const authRouter = express.Router();

authRouter.post("/register", Register);
authRouter.post("/login", Login);
authRouter.post("/logout", Logout);
authRouter.post("/refresh", Refresh);
authRouter.get("/me", AuthenticationToken, GetUser);
// authRouter.post("/forgot-password", ForgotPassword);
// authRouter.post("/reset-password", ResetPassword);

export default authRouter;
