import fs from "fs";
import path from "path";
import crypto from "crypto";

import { redis } from "../../configs/redis.js";
import { CreateError } from "../utils/ErrorHandle.js";
import storyQueue from "../../worker/queues/story.queue.js";
import { getTempDir, getChunksDir, checkFreeDiskSpace, safeUnlink, mergeChunksSequentially } from "../utils/zip/zipStorage.js";
import { ZIP_CLEANUP_AFTER_PROCESSING } from "../constants/Story.js";

export const CHUNK_SESSION_TTL = 86400; // 24 hours

/**
 * Initializes a chunked upload session or resumes an existing one if matching fileHash exists.
 *
 * @param {object} params
 * @param {string} params.fileName - Original file name (must end with .zip)
 * @param {number} params.fileSize - Total file size in bytes
 * @param {number} params.totalChunks - Total number of chunks
 * @param {number} [params.chunkSize] - Size of each chunk in bytes
 * @param {string} [params.fileHash] - Unique client-computed file fingerprint/hash
 * @param {string} [params.userId] - Uploader user ID
 * @param {boolean} [params.cleanupAfterProcessing]
 * @returns {Promise<{ sessionId: string, fileName: string, fileSize: number, totalChunks: number, chunkSize: number, uploadedChunks: number[], isResumed: boolean }>}
 */
export async function initChunkSession({ fileName, fileSize, totalChunks, chunkSize, fileHash, userId, cleanupAfterProcessing }) {
  if (!fileName || !fileName.toLowerCase().endsWith(".zip")) {
    throw CreateError(400, "Chỉ hỗ trợ file nén định dạng .zip");
  }

  const { uploadsDir } = getTempDir();

  // Ensure disk has enough space: file size + safety buffer
  const space = await checkFreeDiskSpace(uploadsDir, Math.round(fileSize * 1.5));
  if (!space.hasSpace) {
    throw CreateError(507, "Dung lượng ổ đĩa không đủ để bắt đầu tải file zip");
  }

  // Check if session can be resumed via fileHash
  if (fileHash) {
    const existingSessionId = await redis.get(`chunk_upload:hash:${fileHash}`);
    if (existingSessionId) {
      const rawSession = await redis.get(`chunk_upload:session:${existingSessionId}`);
      if (rawSession) {
        const session = JSON.parse(rawSession);
        if (session.fileSize === fileSize && session.totalChunks === totalChunks) {
          const uploadedChunksRaw = await redis.smembers(`chunk_upload:chunks:${existingSessionId}`);
          const uploadedChunks = uploadedChunksRaw.map(Number).sort((a, b) => a - b);
          return {
            sessionId: existingSessionId,
            fileName: session.fileName,
            fileSize: session.fileSize,
            totalChunks: session.totalChunks,
            chunkSize: session.chunkSize,
            uploadedChunks,
            isResumed: true,
          };
        }
      }
    }
  }

  // Create new upload session
  const sessionId = `session_chunk_${Date.now()}_${crypto.randomUUID().slice(0, 8)}`;
  const effectiveChunkSize = chunkSize || Math.ceil(fileSize / totalChunks);

  const sessionMeta = {
    sessionId,
    fileName: path.basename(fileName),
    fileSize,
    totalChunks,
    chunkSize: effectiveChunkSize,
    fileHash: fileHash || null,
    userId: userId || null,
    cleanupAfterProcessing: cleanupAfterProcessing !== undefined ? cleanupAfterProcessing : ZIP_CLEANUP_AFTER_PROCESSING,
    createdAt: Date.now(),
  };

  await redis.setex(`chunk_upload:session:${sessionId}`, CHUNK_SESSION_TTL, JSON.stringify(sessionMeta));

  if (fileHash) {
    await redis.setex(`chunk_upload:hash:${fileHash}`, CHUNK_SESSION_TTL, sessionId);
  }

  const sessionChunksDir = getChunksDir(sessionId);
  await fs.promises.mkdir(sessionChunksDir, { recursive: true });

  return {
    sessionId,
    fileName: sessionMeta.fileName,
    fileSize: sessionMeta.fileSize,
    totalChunks: sessionMeta.totalChunks,
    chunkSize: sessionMeta.chunkSize,
    uploadedChunks: [],
    isResumed: false,
  };
}

/**
 * Retrieves the current status and list of uploaded chunks for a session.
 *
 * @param {object} params
 * @param {string} params.sessionId
 * @returns {Promise<{ sessionId: string, fileName: string, fileSize: number, totalChunks: number, chunkSize: number, uploadedChunks: number[], missingChunks: number[], uploadedCount: number, isComplete: boolean }>}
 */
export async function getChunkStatus({ sessionId }) {
  if (!sessionId) {
    throw CreateError(400, "Vui lòng cung cấp sessionId");
  }

  const rawSession = await redis.get(`chunk_upload:session:${sessionId}`);
  if (!rawSession) {
    throw CreateError(404, "Phiên tải lên không tồn tại hoặc đã hết hạn");
  }

  const session = JSON.parse(rawSession);
  const uploadedChunksRaw = await redis.smembers(`chunk_upload:chunks:${sessionId}`);
  const uploadedChunks = uploadedChunksRaw.map(Number).sort((a, b) => a - b);
  const uploadedSet = new Set(uploadedChunks);

  const missingChunks = [];
  for (let i = 0; i < session.totalChunks; i++) {
    if (!uploadedSet.has(i)) {
      missingChunks.push(i);
    }
  }

  return {
    sessionId,
    fileName: session.fileName,
    fileSize: session.fileSize,
    totalChunks: session.totalChunks,
    chunkSize: session.chunkSize,
    uploadedChunks,
    missingChunks,
    uploadedCount: uploadedChunks.length,
    isComplete: uploadedChunks.length === session.totalChunks,
  };
}

/**
 * Saves an uploaded chunk file, stores its index in Redis, and refreshes session TTL.
 *
 * @param {object} params
 * @param {string} params.sessionId
 * @param {number|string} params.chunkIndex
 * @param {Express.Multer.File} params.file
 * @returns {Promise<{ success: boolean, sessionId: string, chunkIndex: number, uploadedCount: number, totalChunks: number }>}
 */
export async function saveChunk({ sessionId, chunkIndex, file }) {
  if (!sessionId) {
    if (file?.path) await safeUnlink(file.path);
    throw CreateError(400, "Vui lòng cung cấp sessionId");
  }

  if (chunkIndex === undefined || chunkIndex === null || isNaN(Number(chunkIndex))) {
    if (file?.path) await safeUnlink(file.path);
    throw CreateError(400, "Vui lòng cung cấp chunkIndex hợp lệ");
  }

  if (!file || !file.path) {
    throw CreateError(400, "Vui lòng đính kèm file chunk");
  }

  const idx = Number(chunkIndex);

  const rawSession = await redis.get(`chunk_upload:session:${sessionId}`);
  if (!rawSession) {
    await safeUnlink(file.path);
    throw CreateError(404, "Phiên tải lên không tồn tại hoặc đã hết hạn");
  }

  const session = JSON.parse(rawSession);
  if (idx < 0 || idx >= session.totalChunks) {
    await safeUnlink(file.path);
    throw CreateError(400, `chunkIndex ${idx} nằm ngoài phạm vi tổng số chunk (${session.totalChunks})`);
  }

  const sessionChunksDir = getChunksDir(sessionId);
  await fs.promises.mkdir(sessionChunksDir, { recursive: true });

  const targetChunkPath = path.join(sessionChunksDir, `chunk_${idx}`);

  // Move uploaded chunk to target location
  try {
    if (file.path !== targetChunkPath) {
      await fs.promises.rename(file.path, targetChunkPath);
    }
  } catch {
    // Fallback if cross-device
    await fs.promises.copyFile(file.path, targetChunkPath);
    await safeUnlink(file.path);
  }

  // Record in Redis
  await redis.sadd(`chunk_upload:chunks:${sessionId}`, idx.toString());
  await redis.expire(`chunk_upload:chunks:${sessionId}`, CHUNK_SESSION_TTL);
  await redis.expire(`chunk_upload:session:${sessionId}`, CHUNK_SESSION_TTL);
  if (session.fileHash) {
    await redis.expire(`chunk_upload:hash:${session.fileHash}`, CHUNK_SESSION_TTL);
  }

  const currentCount = await redis.scard(`chunk_upload:chunks:${sessionId}`);

  return {
    success: true,
    sessionId,
    chunkIndex: idx,
    uploadedCount: currentCount,
    totalChunks: session.totalChunks,
  };
}

/**
 * Completes chunked upload by merging chunks sequentially, verifying completeness,
 * and enqueuing the background zip import worker job.
 *
 * @param {object} params
 * @param {string} params.sessionId
 * @param {string} [params.userId]
 * @param {boolean} [params.cleanupAfterProcessing]
 * @returns {Promise<{ sessionId: string, fileName: string, fileSize: number, zipPath: string }>}
 */
export async function completeChunkUpload({ sessionId, userId, cleanupAfterProcessing } = {}) {
  if (!sessionId) {
    throw CreateError(400, "Vui lòng cung cấp sessionId");
  }

  const rawSession = await redis.get(`chunk_upload:session:${sessionId}`);
  if (!rawSession) {
    throw CreateError(404, "Phiên tải lên không tồn tại hoặc đã hết hạn");
  }

  const session = JSON.parse(rawSession);
  const uploadedChunksRaw = await redis.smembers(`chunk_upload:chunks:${sessionId}`);
  const uploadedSet = new Set(uploadedChunksRaw.map(Number));

  if (uploadedSet.size < session.totalChunks) {
    const missingChunks = [];
    for (let i = 0; i < session.totalChunks; i++) {
      if (!uploadedSet.has(i)) {
        missingChunks.push(i);
      }
    }
    const err = CreateError(400, `Chưa nhận đủ tất cả các chunk (${uploadedSet.size}/${session.totalChunks})`);
    err.data = { missingChunks };
    throw err;
  }

  const { uploadsDir } = getTempDir();
  const safeFilename = `${sessionId}.zip`;
  const targetZipPath = path.join(uploadsDir, safeFilename);

  // Merge chunks sequentially
  const mergedResult = await mergeChunksSequentially({
    sessionId,
    totalChunks: session.totalChunks,
    targetFilePath: targetZipPath,
  });

  // Cleanup Redis session keys
  await redis.del(`chunk_upload:session:${sessionId}`);
  await redis.del(`chunk_upload:chunks:${sessionId}`);
  if (session.fileHash) {
    await redis.del(`chunk_upload:hash:${session.fileHash}`);
  }

  const shouldCleanup =
    cleanupAfterProcessing !== undefined
      ? cleanupAfterProcessing
      : session.cleanupAfterProcessing !== undefined
        ? session.cleanupAfterProcessing
        : ZIP_CLEANUP_AFTER_PROCESSING;

  // Enqueue BullMQ worker job
  await storyQueue.addJob_BatchImportZip({
    zipFilePath: mergedResult.filePath,
    originalName: session.fileName,
    userId: userId || session.userId,
    sessionId,
    cleanupAfterProcessing: shouldCleanup,
  });

  return {
    sessionId,
    fileName: session.fileName,
    fileSize: mergedResult.size,
    zipPath: mergedResult.filePath,
  };
}

export default {
  initChunkSession,
  getChunkStatus,
  saveChunk,
  completeChunkUpload,
};
