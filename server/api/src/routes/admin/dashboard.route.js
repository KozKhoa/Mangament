import express from "express";

import { ValidateData } from "../../middlewares/Validate.Middleware.js";
import adminSchemas from "../../schemas/admin.schemas.js";

import adminController from "../../controllers/admin/index.js";

const adminDashboardRoute = express.Router();

adminDashboardRoute.get("/overview", adminController.dashboard.getDashboardOverview);

adminDashboardRoute.get("/stats/views", ValidateData(adminSchemas.dashboardView), adminController.dashboard.getDashboardViewInRange);

adminDashboardRoute.get("/stats/new-users", ValidateData(adminSchemas.dashboardNewUsers), adminController.dashboard.getDashboardNewUsers);

export default adminDashboardRoute;
