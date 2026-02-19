import express from "express";

import uploadMulter from "../configs/multer.js";

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
adminRoute.get("/dashboard/stats/new-users", adminController.GetDashboardNewUsers);

adminRoute.get("/stories/:id", adminController.GetStory);
adminRoute.get("/stories", adminController.GetAllStories);
adminRoute.put("/stories/:id", adminController.UpdateStory);
adminRoute.post("/stories", uploadMulter.single("coverArt"), adminController.PostNewStory);
adminRoute.patch("/stories/:id/active", adminController.ToggleActiveStory);
adminRoute.delete("/stories/:id", adminController.DeleteStory);

export default adminRoute;
