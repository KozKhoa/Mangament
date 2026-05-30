import express from "express";

import { ValidateData } from "../../middlewares/Validate.Middleware.js";
import adminSchemas from "../../schemas/admin.schemas.js";

import adminController from "../../controllers/admin/index.js";

const adminUserRoute = express.Router();

adminUserRoute.get("/", ValidateData(adminSchemas.getAllUsers), adminController.user.getAllUsers);

adminUserRoute.get("/:id", ValidateData(adminSchemas.getUser), adminController.user.getUser);

adminUserRoute.put("/:id", ValidateData(adminSchemas.updateUser), adminController.user.updateUserInfo);

adminUserRoute.delete("/:id", ValidateData(adminSchemas.deleteUser), adminController.user.deleteUser);

adminUserRoute.patch("/:id/ban", ValidateData(adminSchemas.banUser), adminController.user.banUser);

export default adminUserRoute;
