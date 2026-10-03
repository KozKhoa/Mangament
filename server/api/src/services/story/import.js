import path from "path";
import crypto from "crypto";
import db from "../../../configs/db.js";
import { CreateError } from "../../utils/ErrorHandle.js";
import storyQueue from "../../../worker/queues/story.queue.js";
import { parseStoriesSpreadsheet } from "../../utils/spreadsheet.parser.js";
import { downloadZipFromUrl } from "../../utils/zip/zipStorage.js";

/**
 * Tiếp nhận và enqueue job batch import file ZIP vào hàng đợi worker
 * @param {Object} params
 * @param {Express.Multer.File} params.file
 * @param {string} [params.userId]
 * @param {boolean} [params.cleanupAfterProcessing]
 * @returns {Promise<{ sessionId: string, fileName: string, fileSize: number, zipPath: string }>}
 */
export async function ProcessUploadBatchZip({ file, userId, cleanupAfterProcessing } = {}) {
  if (!file) {
    throw CreateError(400, "Vui lòng đính kèm file zip thông qua trường 'file'");
  }

  const sessionId = file.sessionId || `session_${Date.now()}_${crypto.randomUUID().slice(0, 8)}`;

  // Lưu thông tin phiên import vào database
  try {
    await db.storyImportSession.create({
      data: {
        session_id: sessionId,
        user_id: userId || null,
        source_type: "zip_upload",
        status: "pending",
        file_name: file.originalname || file.filename,
        file_size: file.size ? BigInt(file.size) : null,
        started_at: new Date(),
        progress: 5,
      },
    });
  } catch (err) {
    console.error(`[StoryService] Lỗi tạo StoryImportSession cho upload-zip:`, err);
  }

  await storyQueue.addJob_BatchImportZip({
    zipFilePath: file.path,
    originalName: file.originalname || file.filename,
    userId,
    sessionId,
    cleanupAfterProcessing,
  });

  return {
    sessionId,
    fileName: file.originalname || file.filename,
    fileSize: file.size,
    zipPath: file.path,
  };
}

/**
 * Tải file ZIP từ URL bên ngoài về diskStorage và enqueue vào hàng đợi worker
 * @param {Object} params
 * @param {string} params.url
 * @param {string} [params.userId]
 * @param {boolean} [params.cleanupAfterProcessing]
 * @returns {Promise<{ sessionId: string, url: string, fileName: string, fileSize: number, zipPath: string }>}
 */
export async function ProcessDownloadBatchZip({ url, userId, cleanupAfterProcessing } = {}) {
  if (!url) {
    throw CreateError(400, "Vui lòng cung cấp trường 'url' chứa đường dẫn tải file zip");
  }

  const sessionId = `session_${Date.now()}_${crypto.randomUUID().slice(0, 8)}`;

  // Tải trực tiếp stream vào diskStorage trong uploadsDir kèm giám sát dung lượng đĩa
  const downloadResult = await downloadZipFromUrl(url, { sessionId });

  // Lưu thông tin phiên import vào database
  try {
    await db.storyImportSession.create({
      data: {
        session_id: sessionId,
        user_id: userId || null,
        source_type: "zip_remote_download",
        status: "pending",
        source_url: url,
        file_name: downloadResult.filename,
        file_size: downloadResult.size ? BigInt(downloadResult.size) : null,
        started_at: new Date(),
        progress: 5,
      },
    });
  } catch (err) {
    console.error(`[StoryService] Lỗi tạo StoryImportSession cho download-zip:`, err);
  }

  await storyQueue.addJob_BatchImportZip({
    zipFilePath: downloadResult.filePath,
    originalName: path.basename(url) || downloadResult.filename,
    userId,
    sessionId,
    cleanupAfterProcessing,
  });

  return {
    sessionId,
    url,
    fileName: downloadResult.filename,
    fileSize: downloadResult.size,
    zipPath: downloadResult.filePath,
  };
}

/**
 * Parse và enqueue job batch import file bảng tính (.csv/.xlsx) vào hàng đợi worker
 * @param {Object} params
 * @param {Buffer} params.buffer
 * @param {string} params.fileName
 * @param {string} [params.userId]
 * @returns {Promise<{ totalRows: number, fileName: string }>}
 */
export async function ProcessBatchImportSpreadsheet({ buffer, fileName, userId } = {}) {
  if (!buffer) {
    throw CreateError(400, "Vui lòng đính kèm file bảng tính hợp lệ");
  }

  const rows = parseStoriesSpreadsheet(buffer);

  if (!rows || rows.length === 0) {
    throw CreateError(400, "File bảng tính không có dòng dữ liệu truyện hợp lệ nào");
  }

  const sessionId = `session_csv_${Date.now()}_${crypto.randomUUID().slice(0, 8)}`;
  try {
    await db.storyImportSession.create({
      data: {
        session_id: sessionId,
        user_id: userId || null,
        source_type: "csv_upload",
        status: "processing",
        file_name: fileName,
        total_rows: rows.length,
        started_at: new Date(),
        progress: 10,
      },
    });
  } catch (err) {
    console.error(`[StoryService] Lỗi tạo StoryImportSession cho csv:`, err);
  }

  await storyQueue.addJob_BatchImportStories({
    rows,
    userId,
    fileName,
    sessionId,
  });

  return {
    sessionId,
    totalRows: rows.length,
    fileName,
  };
}
