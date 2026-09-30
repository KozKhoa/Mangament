import * as dashboardService from "./dashboard";
import * as userService from "./user";
import * as storyService from "./story";
import * as trashService from "./trash";
import * as storyImportService from "./story-import";

export * from "./types";
export * from "./dashboard";
export * from "./user";
export * from "./story";
export * from "./trash";
export * from "./story-import";

const adminService = {
  // Dashboard & Statistics
  ...dashboardService,

  // User Management
  ...userService,

  // Story Management
  ...storyService,

  // Trash & Recycle Bin
  ...trashService,

  // Story Import & Chunked Upload
  ...storyImportService,
};

export default adminService;
