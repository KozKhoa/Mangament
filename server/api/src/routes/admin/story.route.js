import express from "express";
import multer from "multer";
import path from "path";

import { ValidateData } from "../../middlewares/Validate.Middleware.js";
import adminSchemas from "../../schemas/admin.schemas.js";

import adminController from "../../controllers/admin/index.js";

const spreadsheetFileFilter = (req, file, cb) => {
  const ext = path.extname(file.originalname || "").toLowerCase();
  const allowed = [".csv", ".xlsx", ".xls"];
  if (allowed.includes(ext)) {
    cb(null, true);
  } else {
    const error = new Error("Chỉ hỗ trợ tải lên file định dạng .csv, .xlsx, .xls");
    error.status = 400;
    cb(error, false);
  }
};

const uploadSpreadsheet = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 20 * 1024 * 1024, // 20MB
    files: 1,
  },
  fileFilter: spreadsheetFileFilter,
});

import { createZipDiskStorageEngine } from "../../utils/zip/zipStorage.js";

const zipFileFilter = (req, file, cb) => {
  const ext = path.extname(file.originalname || "").toLowerCase();
  if (ext === ".zip") {
    cb(null, true);
  } else {
    const error = new Error("Chỉ hỗ trợ tải lên file nén định dạng .zip");
    error.status = 400;
    cb(error, false);
  }
};

const uploadZip = multer({
  storage: createZipDiskStorageEngine(),
  fileFilter: zipFileFilter,
});

const validatePostStory = (req, res, next) => {
  if (req.file) {
    return next();
  }
  return ValidateData(adminSchemas.postStory)(req, res, next);
};

const adminStoryRoute = express.Router();

adminStoryRoute.get("/", ValidateData(adminSchemas.getAllStories), adminController.story.getAllStories);

adminStoryRoute.get("/trash", ValidateData(adminSchemas.getAllTrashStories), adminController.story.getAllTrashStories);

adminStoryRoute.get("/import-template", adminController.story.getStoryImportTemplate);

adminStoryRoute.get("/:id", ValidateData(adminSchemas.getStory), adminController.story.getStory);

adminStoryRoute.post("/upload-zip", uploadZip.single("file"), adminController.story.uploadBatchZipStory);

adminStoryRoute.post("/download-zip", ValidateData(adminSchemas.downloadBatchZipStory), adminController.story.downloadBatchZipStory);

adminStoryRoute.post("/", uploadSpreadsheet.single("file"), validatePostStory, adminController.story.postNewStory);

adminStoryRoute.patch("/:id/cover-art", ValidateData(adminSchemas.updateStoryCoverArt), adminController.story.updateStoryCoverArt);

adminStoryRoute.put("/:id", ValidateData(adminSchemas.updateStory), adminController.story.updateStory);

adminStoryRoute.patch("/:id/active", ValidateData(adminSchemas.toggleActiveStory), adminController.story.toggleActiveStory);

adminStoryRoute.delete("/trash", ValidateData(adminSchemas.deleteManyTrashStories), adminController.story.deleteManyTrashStories);

adminStoryRoute.delete("/:id", ValidateData(adminSchemas.deleteStory), adminController.story.deleteStory);

adminStoryRoute.delete("/trash/:id", ValidateData(adminSchemas.deleteTrashStory), adminController.story.deleteTrashStory);

adminStoryRoute.patch("/trash/restore", ValidateData(adminSchemas.restoreManyTrashStories), adminController.story.restoreManyTrashStories);

adminStoryRoute.patch("/trash/:id/restore", ValidateData(adminSchemas.restoreTrashStory), adminController.story.restoreTrashStory);

export default adminStoryRoute;
