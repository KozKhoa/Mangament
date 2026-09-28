import express from "express";
import multer from "multer";
import path from "path";
import crypto from "crypto";

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
    fileSize: 50 * 1024 * 1024, // 50MB
    files: 1,
  },
  fileFilter: spreadsheetFileFilter,
});

import fs from "fs";
import { createZipDiskStorageEngine, getTempDir, safeUnlink } from "../../utils/zip/zipStorage.js";

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
  limits: {
    fileSize: 100 * 1024 * 1024, // Tối đa 100MB cho phương thức upload nguyên file trực tiếp
    files: 1,
  },
});

const uploadZipMiddleware = (req, res, next) => {
  uploadZip.single("file")(req, res, (err) => {
    if (err) {
      if (err instanceof multer.MulterError && err.code === "LIMIT_FILE_SIZE") {
        const customErr = new Error(
          "Dung lượng file zip vượt quá giới hạn tối đa 100MB cho phương thức tải trực tiếp. Đối với file lớn hơn 100MB (hoặc hàng GB), vui lòng sử dụng phương thức upload theo chunk (/admin/stories/upload-zip/chunk/init).",
        );
        customErr.status = 413;
        return next(customErr);
      }
      return next(err);
    }
    next();
  });
};

const uploadChunk = multer({
  storage: multer.diskStorage({
    destination: (req, file, cb) => {
      const { stagingDir } = getTempDir();
      cb(null, stagingDir);
    },
    filename: (req, file, cb) => {
      const ext = path.extname(file.originalname || "") || ".chunk";
      const filename = `tmp_${Date.now()}_${crypto.randomUUID().slice(0, 8)}${ext}`;
      const { stagingDir } = getTempDir();
      req._uploadedChunkPaths = req._uploadedChunkPaths || [];
      req._uploadedChunkPaths.push(path.join(stagingDir, filename));
      cb(null, filename);
    },
  }),
  limits: {
    fileSize: 50 * 1024 * 1024, // 50MB per chunk limit
    files: 1,
  },
});

const chunkUploadMiddleware = (req, res, next) => {
  // Lắng nghe sự kiện ngắt kết nối giữa chừng (aborted / network drop) để xóa file chunk dở dang
  req.on("close", () => {
    if (!req.complete && req._uploadedChunkPaths?.length) {
      for (const p of req._uploadedChunkPaths) {
        if (fs.existsSync(p)) {
          safeUnlink(p).catch(() => {});
        }
      }
    }
  });

  uploadChunk.fields([
    { name: "chunk", maxCount: 1 },
    { name: "file", maxCount: 1 },
  ])(req, res, (err) => {
    if (err) {
      if (req._uploadedChunkPaths?.length) {
        for (const p of req._uploadedChunkPaths) {
          if (fs.existsSync(p)) safeUnlink(p).catch(() => {});
        }
      }
      return next(err);
    }

    if (req.files) {
      const chosenFile = req.files.chunk?.[0] || req.files.file?.[0];
      req.file = chosenFile;

      // Nếu client gửi cả 2 trường chunk và file, dọn dẹp các file thừa không được chọn
      const allFiles = [...(req.files.chunk || []), ...(req.files.file || [])];
      for (const f of allFiles) {
        if (f !== chosenFile && f?.path && fs.existsSync(f.path)) {
          safeUnlink(f.path).catch(() => {});
        }
      }
    }
    next();
  });
};

const validatePostStory = (req, res, next) => {
  if (req.file) {
    return next();
  }
  return ValidateData(adminSchemas.postStory)(req, res, next);
};

const adminStoryRoute = express.Router();

adminStoryRoute.get("/", ValidateData(adminSchemas.getAllStories), adminController.story.getAllStories);

adminStoryRoute.get("/trash", ValidateData(adminSchemas.getAllTrashStories), adminController.story.getAllTrashStories);

adminStoryRoute.get("/template/import-template", adminController.story.getStoryImportTemplate);

adminStoryRoute.get("/:id", ValidateData(adminSchemas.getStory), adminController.story.getStory);

adminStoryRoute.post("/", uploadSpreadsheet.single("file"), validatePostStory, adminController.story.postNewStory);

adminStoryRoute.patch("/:id/cover-art", ValidateData(adminSchemas.updateStoryCoverArt), adminController.story.updateStoryCoverArt);

adminStoryRoute.put("/:id", ValidateData(adminSchemas.updateStory), adminController.story.updateStory);

adminStoryRoute.patch("/:id/active", ValidateData(adminSchemas.toggleActiveStory), adminController.story.toggleActiveStory);

adminStoryRoute.delete("/trash", ValidateData(adminSchemas.deleteManyTrashStories), adminController.story.deleteManyTrashStories);

adminStoryRoute.delete("/:id", ValidateData(adminSchemas.deleteStory), adminController.story.deleteStory);

adminStoryRoute.delete("/trash/:id", ValidateData(adminSchemas.deleteTrashStory), adminController.story.deleteTrashStory);

adminStoryRoute.patch("/trash/restore", ValidateData(adminSchemas.restoreManyTrashStories), adminController.story.restoreManyTrashStories);

adminStoryRoute.patch("/trash/:id/restore", ValidateData(adminSchemas.restoreTrashStory), adminController.story.restoreTrashStory);

// Chunked / Resumable zip upload endpoints
adminStoryRoute.post("/import/upload-zip/chunk/init", ValidateData(adminSchemas.initChunkUpload), adminController.story.initChunkUpload);

adminStoryRoute.get("/import/upload-zip/chunk/status", ValidateData(adminSchemas.getChunkStatus), adminController.story.getChunkStatus);

adminStoryRoute.post("/import/upload-zip/chunk/upload", chunkUploadMiddleware, ValidateData(adminSchemas.uploadChunk), adminController.story.uploadChunk);

adminStoryRoute.post("/import/upload-zip/chunk/complete", ValidateData(adminSchemas.completeChunkUpload), adminController.story.completeChunkUpload);

adminStoryRoute.post("/import/upload-zip", uploadZipMiddleware, adminController.story.uploadBatchZipStory);

adminStoryRoute.post("/import/download-zip", ValidateData(adminSchemas.downloadBatchZipStory), adminController.story.downloadBatchZipStory);

adminStoryRoute.delete("/import/:sessionId", ValidateData(adminSchemas.cancelImportSession), adminController.story.cancelImportSession);

export default adminStoryRoute;
