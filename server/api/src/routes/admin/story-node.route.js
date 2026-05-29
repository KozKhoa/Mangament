import express from "express";

import { ValidateData } from "../../middlewares/Validate.Middleware.js";
import adminSchemas from "../../schemas/admin.schemas.js";

import adminController from "../../controllers/admin";

const adminStoryNodeRoute = express.Router();

adminStoryNodeRoute.get("/story-nodes/trash", ValidateData(adminSchemas.getAllStoryNodesTrash), adminController.storyNode.getAllStoryNodesTrash);

adminStoryNodeRoute.patch(
  "/story-nodes/trash/restore",
  ValidateData(adminSchemas.restoreManyTrashStoryNodes),
  adminController.storyNode.restoreManyTrashStoryNodes,
);

adminStoryNodeRoute.patch("/story-nodes/trash/:id/restore", ValidateData(adminSchemas.restoreTrashStoryNode), adminController.storyNode.restoreTrashStoryNode);

adminStoryNodeRoute.delete(
  "/story-nodes/trash/:id",
  ValidateData(adminSchemas.deletePermanentlyTrashStoryNode),
  adminController.storyNode.deletePermanentlyTrashStoryNode,
);

adminStoryNodeRoute.delete(
  "/story-nodes/trash",
  ValidateData(adminSchemas.deletePermanentlyManyTrashStoryNodes),
  adminController.storyNode.deletePermanentlyManyTrashStoryNodes,
);

export default adminStoryNodeRoute;
