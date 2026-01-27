import express from "express";

import { ForgotPassword, Login, Logout, Refresh, Register, ResetPassword } from "../controllers/Auth.Controller.js";

import { GetUser } from "../controllers/User.Controller.js";

import { AuthenticationToken, AuthorizationRole } from "../middlewares/Auth.Middleware.js";

import * as adminController from "../controllers/Admin.Controller.js";

const adminRoute = express.Router();

adminRoute.use(AuthenticationToken);
adminRoute.use(AuthorizationRole);

adminRoute.get("/users", adminController.GetAllUsers);
adminRoute.get("/users/:id", adminController.GetUser);

adminRoute.put("/users/:id", adminController.UpdateUserInfo);
adminRoute.delete("/users/:id", adminController.DeleteUser);
adminRoute.patch("/users/:id/ban", adminController.BanUser);

adminRoute.get("/dashboard/overview", adminController.GetDashboardOverview);
adminRoute.get("/dashboard/stats/views", adminController.GetDashboardViewInRange);

adminRoute;

export default adminRoute;
