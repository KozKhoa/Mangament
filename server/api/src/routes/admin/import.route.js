import express from "express";
import multer from "multer";
import path from "path";
import crypto from "crypto";
import fs from "fs";

import { ValidateData } from "../../middlewares/Validate.Middleware.js";
import adminSchemas from "../../schemas/admin.schemas.js";
import importController from "../../controllers/admin/import.controller.js";
import { createZipDiskStorageEngine, getTempDir, safeUnlink } from "../../utils/zip/zipStorage.js";

// Multer cho file bảng tính (.csv, .xlsx, .xls)
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

// Multer cho file zip (<100MB)
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
    fileSize: 100 * 1024 * 1024, // Tối đa 100MB cho upload trực tiếp nguyên file
    files: 1,
  },
});

const uploadZipMiddleware = (req, res, next) => {
  uploadZip.single("file")(req, res, (err) => {
    if (err) {
      if (err instanceof multer.MulterError && err.code === "LIMIT_FILE_SIZE") {
        const customErr = new Error(
          "Dung lượng file zip vượt quá giới hạn tối đa 100MB cho phương thức tải trực tiếp. Đối với file lớn hơn 100MB (hoặc hàng GB), vui lòng sử dụng phương thức upload theo chunk (/admin/import/stories/chunk/init).",
        );
        customErr.status = 413;
        return next(customErr);
      }
      return next(err);
    }
    next();
  });
};

// Multer cho từng chunk nhị phân vào staging
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

const adminImportRoute = express.Router();

/**
 * @openapi
 * tags:
 *   - name: Admin Import
 *     description: Quản lý luồng import truyện hàng loạt (Chunked Upload, File Zip, Bảng tính và Lịch sử phiên)
 *
 * /admin/import/stories/template:
 *   get:
 *     tags: [Admin Import]
 *     security:
 *       - bearerAuth: []
 *     summary: Tải file bảng tính mẫu (.xlsx, .csv) hướng dẫn cấu trúc các cột để import truyện
 *     parameters:
 *       - in: query
 *         name: format
 *         schema:
 *           type: string
 *           enum: [xlsx, csv]
 *           default: xlsx
 *         description: Định dạng file mẫu cần tải
 *       - in: query
 *         name: type
 *         schema:
 *           type: string
 *           enum: [full, simple]
 *           default: full
 *         description: Cấu trúc mẫu đầy đủ hoặc rút gọn
 *     responses:
 *       '200':
 *         description: Trả về file nhị phân đính kèm
 *         content:
 *           application/vnd.openxmlformats-officedocument.spreadsheetml.sheet:
 *             schema:
 *               type: string
 *               format: binary
 *
 * /admin/import/stories/chunk/init:
 *   post:
 *     tags: [Admin Import]
 *     security:
 *       - bearerAuth: []
 *     summary: Khởi tạo phiên Chunked Upload cho file ZIP lớn hoặc Resume phiên cũ
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [fileName, fileSize, totalChunks]
 *             properties:
 *               fileName:
 *                 type: string
 *                 example: manga_full_pack.zip
 *               fileSize:
 *                 type: integer
 *                 example: 104857600
 *               totalChunks:
 *                 type: integer
 *                 example: 10
 *               chunkSize:
 *                 type: integer
 *                 example: 10485760
 *               fileHash:
 *                 type: string
 *                 description: Fingerprint MD5/SHA256 của file để hỗ trợ Resume
 *     responses:
 *       '200':
 *         description: Khởi tạo hoặc khôi phục phiên upload thành công
 *
 * /admin/import/stories/chunk/status:
 *   get:
 *     tags: [Admin Import]
 *     security:
 *       - bearerAuth: []
 *     summary: Kiểm tra tiến độ và danh sách chunk đã tải lên của một phiên
 *     parameters:
 *       - in: query
 *         name: sessionId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       '200':
 *         description: Trạng thái và mảng chunk đã nhận
 *
 * /admin/import/stories/chunk/upload:
 *   post:
 *     tags: [Admin Import]
 *     security:
 *       - bearerAuth: []
 *     summary: Tải lên một chunk nhị phân
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             required: [sessionId, chunkIndex, chunk]
 *             properties:
 *               sessionId:
 *                 type: string
 *               chunkIndex:
 *                 type: integer
 *               chunk:
 *                 type: string
 *                 format: binary
 *     responses:
 *       '200':
 *         description: Chunk tải lên thành công
 *
 * /admin/import/stories/chunk/complete:
 *   post:
 *     tags: [Admin Import]
 *     security:
 *       - bearerAuth: []
 *     summary: Báo hoàn tất tất cả chunk để server bắt đầu ghép file và đẩy vào worker
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [sessionId]
 *             properties:
 *               sessionId:
 *                 type: string
 *     responses:
 *       '200':
 *         description: Ghép file thành công và đã bắt đầu worker import ngầm
 *
 * /admin/import/stories/upload-zip:
 *   post:
 *     tags: [Admin Import]
 *     security:
 *       - bearerAuth: []
 *     summary: Tải trực tiếp file ZIP (<100MB) chứa bảng tính và thư mục ảnh
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             required: [file]
 *             properties:
 *               file:
 *                 type: string
 *                 format: binary
 *     responses:
 *       '200':
 *         description: Đã tiếp nhận file zip và đẩy vào worker
 *
 * /admin/import/stories/download-zip:
 *   post:
 *     tags: [Admin Import]
 *     security:
 *       - bearerAuth: []
 *     summary: Yêu cầu máy chủ tải file ZIP từ URL bên ngoài và import ngầm
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [url]
 *             properties:
 *               url:
 *                 type: string
 *                 format: uri
 *     responses:
 *       '200':
 *         description: Tiếp nhận URL và bắt đầu stream tải file
 *
 * /admin/import/stories/spreadsheet:
 *   post:
 *     tags: [Admin Import]
 *     security:
 *       - bearerAuth: []
 *     summary: Import truyện hàng loạt từ file bảng tính Excel/CSV thuần
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             required: [file]
 *             properties:
 *               file:
 *                 type: string
 *                 format: binary
 *     responses:
 *       '200':
 *         description: Đã tiếp nhận dữ liệu bảng tính và đưa vào hàng đợi import
 *
 * /admin/import/sessions:
 *   get:
 *     tags: [Admin Import]
 *     security:
 *       - bearerAuth: []
 *     summary: Lấy danh sách lịch sử các phiên import truyện
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 20
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [pending, merging, extracting, processing, completed, failed, cancelled]
 *       - in: query
 *         name: sourceType
 *         schema:
 *           type: string
 *           enum: [zip_upload, zip_url, csv_upload]
 *     responses:
 *       '200':
 *         description: Danh sách các phiên import kèm phân trang
 *
 * /admin/import/sessions/{sessionId}:
 *   get:
 *     tags: [Admin Import]
 *     security:
 *       - bearerAuth: []
 *     summary: Lấy thông tin chi tiết một phiên import và danh sách các truyện đã import
 *     parameters:
 *       - in: path
 *         name: sessionId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       '200':
 *         description: Chi tiết phiên import và log các truyện
 *
 *   delete:
 *     tags: [Admin Import]
 *     security:
 *       - bearerAuth: []
 *     summary: Hủy phiên tải lên hoặc dọn dẹp dữ liệu tạm của phiên import
 *     parameters:
 *       - in: path
 *         name: sessionId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       '200':
 *         description: Hủy phiên thành công
 */

// Route Tải template mẫu
adminImportRoute.get("/stories/template", importController.getStoryImportTemplate);

// Nhóm Route Chunked Upload cho file ZIP
adminImportRoute.post("/stories/chunk/init", ValidateData(adminSchemas.initChunkUpload), importController.initChunkUpload);
adminImportRoute.get("/stories/chunk/status", ValidateData(adminSchemas.getChunkStatus), importController.getChunkStatus);
adminImportRoute.post("/stories/chunk/upload", chunkUploadMiddleware, ValidateData(adminSchemas.uploadChunk), importController.uploadChunk);
adminImportRoute.post("/stories/chunk/complete", ValidateData(adminSchemas.completeChunkUpload), importController.completeChunkUpload);

// Nhóm Route Upload Zip / URL / Bảng tính
adminImportRoute.post("/stories/upload-zip", uploadZipMiddleware, importController.uploadBatchZipStory);
adminImportRoute.post("/stories/download-zip", ValidateData(adminSchemas.downloadBatchZipStory), importController.downloadBatchZipStory);
adminImportRoute.post("/stories/spreadsheet", uploadSpreadsheet.single("file"), importController.importStoriesSpreadsheet);

// Nhóm Route Quản lý Lịch sử Phiên Import (Sessions)
adminImportRoute.get("/sessions", importController.getImportSessions);
adminImportRoute.get("/sessions/:sessionId", ValidateData(adminSchemas.cancelImportSession), importController.getImportSessionDetail);
adminImportRoute.delete("/sessions/:sessionId", ValidateData(adminSchemas.cancelImportSession), importController.cancelImportSession);

// Hỗ trợ alias xóa theo sessionId: DELETE /admin/import/:sessionId
adminImportRoute.delete("/:sessionId", ValidateData(adminSchemas.cancelImportSession), importController.cancelImportSession);

export default adminImportRoute;
