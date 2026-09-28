import path from "path";
import { CreateError } from "../../utils/ErrorHandle.js";
import * as storyService from "../../services/story.service.js";
import * as chunkUploadService from "../../services/chunk-upload.service.js";
import { generateStoryImportTemplate } from "../../utils/spreadsheet.parser.js";
import { ZIP_CLEANUP_AFTER_PROCESSING } from "../../constants/Story.js";

/**
 * GET /admin/import/stories/template
 * Tải file bảng tính mẫu (.xlsx / .csv) hướng dẫn cấu trúc các cột để import
 */
export async function getStoryImportTemplate(req, res, next) {
  try {
    const format = String(req.query?.format || "xlsx").toLowerCase();
    const type = String(req.query?.type || "full").toLowerCase();

    const { buffer, mimeType, fileName } = generateStoryImportTemplate(type, format);

    res.setHeader("Content-Type", mimeType);
    res.setHeader("Content-Disposition", `attachment; filename="${fileName}"`);
    return res.send(buffer);
  } catch (error) {
    next(error);
  }
}

/**
 * POST /admin/import/stories/chunk/init
 * Khởi tạo phiên tải lên theo chunk hoặc khôi phục phiên nếu cùng fileHash
 */
export async function initChunkUpload(req, res, next) {
  try {
    const userId = req.user?.id;
    const { fileName, fileSize, totalChunks, chunkSize, fileHash } = req.body || {};

    const result = await chunkUploadService.initChunkSession({
      fileName,
      fileSize,
      totalChunks,
      chunkSize,
      fileHash,
      userId,
      cleanupAfterProcessing: ZIP_CLEANUP_AFTER_PROCESSING,
    });

    return res.status(200).json({
      success: true,
      message: result.isResumed ? "Khôi phục phiên tải lên thành công" : "Khởi tạo phiên tải lên thành công",
      data: result,
    });
  } catch (error) {
    next(error);
  }
}

/**
 * GET /admin/import/stories/chunk/status
 * Lấy trạng thái phiên tải lên và danh sách các chunk đã tải
 */
export async function getChunkStatus(req, res, next) {
  try {
    const { sessionId } = req.query || {};

    const result = await chunkUploadService.getChunkStatus({ sessionId });

    return res.status(200).json({
      success: true,
      data: result,
    });
  } catch (error) {
    next(error);
  }
}

/**
 * POST /admin/import/stories/chunk/upload
 * Nhận một chunk nhị phân và lưu trữ trên đĩa
 */
export async function uploadChunk(req, res, next) {
  try {
    const { sessionId, chunkIndex } = req.body || {};
    const file = req.file;

    const result = await chunkUploadService.saveChunk({
      sessionId,
      chunkIndex,
      file,
    });

    return res.status(200).json({
      success: true,
      message: `Đã tải lên chunk ${result.chunkIndex} thành công`,
      data: result,
    });
  } catch (error) {
    next(error);
  }
}

/**
 * POST /admin/import/stories/chunk/complete
 * Ghép các chunk lại thành file ZIP hoàn chỉnh và đẩy vào worker xử lý
 */
export async function completeChunkUpload(req, res, next) {
  try {
    const userId = req.user?.id;
    const { sessionId } = req.body || {};

    const result = await chunkUploadService.completeChunkUpload({
      sessionId,
      userId,
      cleanupAfterProcessing: ZIP_CLEANUP_AFTER_PROCESSING,
    });

    return res.status(200).json({
      success: true,
      message: "Ghép các chunk thành file zip thành công và đã đưa vào worker giải nén, xử lý",
      data: result,
    });
  } catch (error) {
    next(error);
  }
}

/**
 * POST /admin/import/stories/upload-zip
 * Nhận file zip trực tiếp tải lên (<100MB) và đẩy vào worker xử lý
 */
export async function uploadBatchZipStory(req, res, next) {
  try {
    const userId = req.user?.id;
    const file = req.file;

    const result = await storyService.ProcessUploadBatchZip({
      file,
      userId,
      cleanupAfterProcessing: ZIP_CLEANUP_AFTER_PROCESSING,
    });

    return res.status(200).json({
      success: true,
      message: "Tải lên file zip thành công và đã đưa vào hàng đợi xử lý giải nén, import ngầm",
      data: result,
    });
  } catch (error) {
    next(error);
  }
}

/**
 * POST /admin/import/stories/download-zip
 * Tải file zip từ URL bên ngoài và đẩy vào worker xử lý
 */
export async function downloadBatchZipStory(req, res, next) {
  try {
    const userId = req.user?.id;
    const { url } = req.body || {};

    const result = await storyService.ProcessDownloadBatchZip({
      url,
      userId,
      cleanupAfterProcessing: ZIP_CLEANUP_AFTER_PROCESSING,
    });

    return res.status(200).json({
      success: true,
      message: "Đang tải file zip từ URL và đưa vào hàng đợi xử lý import ngầm",
      data: result,
    });
  } catch (error) {
    next(error);
  }
}

/**
 * POST /admin/import/stories/spreadsheet
 * Import truyện hàng loạt từ file bảng tính Excel/CSV thuần
 */
export async function importStoriesSpreadsheet(req, res, next) {
  try {
    const userId = req.user?.id;
    const file = req.file;

    if (!file) {
      throw CreateError(400, "Vui lòng đính kèm file bảng tính (.csv, .xlsx, .xls)");
    }

    const result = await storyService.ProcessBatchImportSpreadsheet({
      buffer: file.buffer,
      fileName: file.originalname,
      userId,
    });

    return res.status(200).json({
      success: true,
      message: `Đã tiếp nhận ${result.totalRows} dòng dữ liệu và đưa vào hàng đợi xử lý ngầm`,
      data: result,
    });
  } catch (error) {
    next(error);
  }
}

/**
 * GET /admin/import/sessions
 * Lấy danh sách lịch sử các phiên import (phân trang, lọc theo status)
 */
export async function getImportSessions(req, res, next) {
  try {
    const { page, limit, status, sourceType } = req.query || {};

    const result = await chunkUploadService.getImportSessions({
      page,
      limit,
      status,
      sourceType,
    });

    return res.status(200).json({
      success: true,
      data: result.sessions,
      pagination: result.pagination,
    });
  } catch (error) {
    next(error);
  }
}

/**
 * GET /admin/import/sessions/:sessionId
 * Lấy chi tiết phiên import và danh sách item đã import
 */
export async function getImportSessionDetail(req, res, next) {
  try {
    const { sessionId } = req.params;

    const result = await chunkUploadService.getImportSessionDetail({ sessionId });

    return res.status(200).json({
      success: true,
      data: result,
    });
  } catch (error) {
    next(error);
  }
}

/**
 * DELETE /admin/import/sessions/:sessionId
 * Hủy phiên tải lên / import và dọn dẹp các file chunk, file zip tạm trên máy chủ
 */
export async function cancelImportSession(req, res, next) {
  try {
    const { sessionId } = req.params;
    const userId = req.user?.id;

    const result = await chunkUploadService.cancelImportSession({ sessionId, userId });

    return res.status(200).json({
      success: true,
      message: "Đã hủy phiên tải lên và dọn dẹp toàn bộ dữ liệu tạm trên server thành công",
      data: result,
    });
  } catch (error) {
    next(error);
  }
}

export default {
  getStoryImportTemplate,
  initChunkUpload,
  getChunkStatus,
  uploadChunk,
  completeChunkUpload,
  uploadBatchZipStory,
  downloadBatchZipStory,
  importStoriesSpreadsheet,
  getImportSessions,
  getImportSessionDetail,
  cancelImportSession,
};
