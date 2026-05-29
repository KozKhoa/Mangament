import express from "express";

import { ValidateData } from "../../middlewares/Validate.Middleware.js";
import adminSchemas from "../../schemas/admin.schemas.js";

import adminController from "../../controllers/admin/index.js";

const adminImageRoute = express.Router();

adminImageRoute.get("/trash", ValidateData(adminSchemas.getAllTrashImages), adminController.image.getAllTrashImages);

adminImageRoute.delete("/trash/:id", ValidateData(adminSchemas.deleteTrashImage), adminController.image.deleteTrashImage);

adminImageRoute.delete("/trash", ValidateData(adminSchemas.deleteManyTrashImages), adminController.image.deleteManyTrashImages);

export default adminImageRoute;
