import fs from "fs";
import path from "path";
import crypto from "crypto";

import db from "../../configs/db.js";
import { redis } from "../../configs/redis.js";
import { CreateError } from "../utils/ErrorHandle.js";
import storyQueue from "../../worker/queues/story.queue.js";
import { getTempDir, getChunksDir, checkFreeDiskSpace, safeUnlink, mergeChunksSequentially } from "../utils/zip/zipStorage.js";
import { ZIP_CLEANUP_AFTER_PROCESSING } from "../constants/Story.js";

export const CHUNK_SESSION_TTL = 2592000; // 30 days
export const STAGING_CLEANUP_TTL_MS = 24 * 60 * 60 * 1000; // 24 hours
export const SESSION_STUCK_TTL_MS = 48 * 60 * 60 * 1000; // 48 hours

/**
 * Quét dọn tự động:
 * 1. Xóa các file chunk tạm trong stagingDir đã tồn tại quá 24 giờ.
 * 2. Đánh dấu failed/cancelled và dọn dẹp các StoryImportSession bị kẹt ở pending/merging/extracting/processing quá 48 giờ.
 */
export async function cleanupStaleStagingAndSessions() {
  const { stagingDir, uploadsDir, processingDir } = getTempDir();
  const now = Date.now();

  // 1. Quét và dọn các file tạm tmp_*.chunk trong stagingDir (>24h)
  try {
    if (fs.existsSync(stagingDir)) {
      const files = await fs.promises.readdir(stagingDir);
      for (const file of files) {
        const filePath = path.join(stagingDir, file);
        try {
          const stat = await fs.promises.stat(filePath);
          if (now - stat.mtimeMs > STAGING_CLEANUP_TTL_MS) {
            await safeUnlink(filePath);
            console.log(`[Cleanup] Đã dọn file chunk mồ côi quá 24h trong staging: ${file}`);
          }
        } catch {}
      }
    }
  } catch (err) {
    console.warn(`[Cleanup] Lỗi dọn dẹp staging directory:`, err.message);
  }

  // 2. Quét dọn các StoryImportSession bị kẹt quá 48 giờ
  try {
    const fortyEightHoursAgo = new Date(now - SESSION_STUCK_TTL_MS);
    const stuckSessions = await db.storyImportSession.findMany({
      where: {
        status: { in: ["pending", "merging", "extracting", "processing"] },
        created_at: { lt: fortyEightHoursAgo },
      },
      take: 20,
    });

    for (const session of stuckSessions) {
      if (session.session_id) {
        const chunksDir = getChunksDir(session.session_id);
        if (fs.existsSync(chunksDir)) await safeUnlink(chunksDir);

        const zipPath = path.join(uploadsDir, `${session.session_id}.zip`);
        if (fs.existsSync(zipPath)) await safeUnlink(zipPath);

        const procDir = path.join(processingDir, session.session_id);
        if (fs.existsSync(procDir)) await safeUnlink(procDir);
      }

      const newStatus = session.status === "pending" ? "cancelled" : "failed";
      await db.storyImportSession
        .update({
          where: { id: session.id },
          data: {
            status: newStatus,
            completed_at: new Date(),
            error_message: "Tiến trình import đã quá thời hạn (48 giờ) và bị gián đoạn do sự cố hệ thống hoặc worker dừng đột ngột.",
          },
        })
        .catch(() => {});

      console.log(`[Cleanup] Đã đánh dấu ${newStatus} cho session kẹt quá 48h: ${session.session_id || session.id}`);
    }
  } catch (err) {
    console.warn(`[Cleanup] Lỗi dọn dẹp các session bị kẹt:`, err.message);
  }
}

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
  const space = await checkFreeDiskSpace(uploadsDir, Math.round(fileSize * 2));
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

  // Dọn dẹp tự động các file staging mồ côi (>24h) và session bị kẹt (>48h)
  try {
    await cleanupStaleStagingAndSessions();

    if (fileHash) {
      const staleSessions = await db.storyImportSession.findMany({
        where: {
          status: { in: ["pending", "merging"] },
          metadata: {
            path: ["fileHash"],
            equals: fileHash,
          },
        },
      });

      for (const stale of staleSessions) {
        if (stale.session_id) {
          const staleChunksDir = getChunksDir(stale.session_id);
          if (fs.existsSync(staleChunksDir)) await safeUnlink(staleChunksDir);
          const staleZip = path.join(uploadsDir, `${stale.session_id}.zip`);
          if (fs.existsSync(staleZip)) await safeUnlink(staleZip);
        }
        await db.storyImportSession
          .update({
            where: { id: stale.id },
            data: {
              status: "cancelled",
              completed_at: new Date(),
              error_message: "Phiên tải lên cũ bị hủy tự động do hết hạn hoặc tải lại file mới.",
            },
          })
          .catch(() => {});
      }
    }
  } catch (cleanErr) {
    console.warn(`[ChunkUpload] Lỗi dọn dẹp phiên hết hạn:`, cleanErr.message);
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

  // Lưu lịch sử phiên tải lên vào DB (StoryImportSession)
  try {
    await db.storyImportSession.create({
      data: {
        session_id: sessionId,
        user_id: userId || null,
        source_type: "zip_upload",
        status: "pending",
        file_name: sessionMeta.fileName,
        file_size: fileSize ? BigInt(fileSize) : null,
        progress: 0,
        metadata: {
          totalChunks,
          chunkSize: effectiveChunkSize,
          fileHash: fileHash || null,
        },
      },
    });
  } catch (err) {
    console.error(`[ChunkUpload] Không thể tạo bản ghi StoryImportSession cho session ${sessionId}:`, err);
  }

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
 * @returns {Promise<{ sessionId: string, fileName: string, fileSize: number, totalChunks: number, chunkSize: number, uploadedChunks: number[], missingChunks: number[], uploadedCount: number, isComplete: boolean, importSession?: object }>}
 */
export async function getChunkStatus({ sessionId }) {
  if (!sessionId) {
    throw CreateError(400, "Vui lòng cung cấp sessionId");
  }

  const rawSession = await redis.get(`chunk_upload:session:${sessionId}`);
  const dbSession = await db.storyImportSession.findUnique({
    where: { session_id: sessionId },
    include: {
      items: {
        take: 20,
        orderBy: { created_at: "desc" },
      },
    },
  });

  const formattedDbSession = dbSession
    ? {
        ...dbSession,
        file_size: dbSession.file_size ? Number(dbSession.file_size) : null,
      }
    : null;

  if (!rawSession) {
    if (dbSession) {
      return {
        sessionId,
        fileName: dbSession.file_name,
        fileSize: dbSession.file_size ? Number(dbSession.file_size) : null,
        totalChunks: dbSession.metadata?.totalChunks || 0,
        chunkSize: dbSession.metadata?.chunkSize || 0,
        uploadedChunks: [],
        missingChunks: [],
        uploadedCount: dbSession.metadata?.totalChunks || 0,
        isComplete: dbSession.status === "completed",
        importSession: formattedDbSession,
      };
    }
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
    importSession: formattedDbSession,
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

  // Update status in StoryImportSession
  try {
    await db.storyImportSession.updateMany({
      where: { session_id: sessionId },
      data: {
        status: "merging",
        started_at: new Date(),
        progress: 5,
      },
    });
  } catch (err) {
    console.error(`[ChunkUpload] Lỗi cập nhật StoryImportSession khi complete:`, err);
  }

  // Enqueue BullMQ worker job to merge chunks and import zip asynchronously
  await storyQueue.addJob_BatchImportZip({
    originalName: session.fileName,
    userId: userId || session.userId,
    sessionId,
    totalChunks: session.totalChunks,
    fileSize: session.fileSize,
    cleanupAfterProcessing: shouldCleanup,
  });

  return {
    success: true,
    sessionId,
    fileName: session.fileName,
    fileSize: session.fileSize,
    message: "Đã nhận đủ tất cả các chunk. Hệ thống đang tiến hành ghép file và xử lý nhập dữ liệu ngầm.",
  };
}

/**
 * Cancels an ongoing upload/import session, deleting uploaded chunks and zip files on disk,
 * removing Redis cache keys, and updating the database session status to 'cancelled'.
 *
 * @param {object} params
 * @param {string} params.sessionId
 * @param {string} [params.userId]
 * @returns {Promise<{ sessionId: string, message: string }>}
 */
export async function cancelImportSession({ sessionId, userId } = {}) {
  if (!sessionId) {
    throw CreateError(400, "Vui lòng cung cấp sessionId");
  }

  // 1. Kiểm tra session trong Redis để lấy fileHash nếu có
  let fileHash = null;
  const rawSession = await redis.get(`chunk_upload:session:${sessionId}`);
  if (rawSession) {
    try {
      const session = JSON.parse(rawSession);
      fileHash = session.fileHash;
    } catch {}
  }

  // 2. Xóa các key trong Redis
  await redis.del(`chunk_upload:session:${sessionId}`);
  await redis.del(`chunk_upload:chunks:${sessionId}`);
  if (fileHash) {
    await redis.del(`chunk_upload:hash:${fileHash}`);
  }

  // 3. Xóa các file và thư mục tạm trên ổ cứng server
  const { uploadsDir, processingDir: rootProcessingDir } = getTempDir();
  const sessionChunksDir = getChunksDir(sessionId);
  const zipFilePath = path.join(uploadsDir, `${sessionId}.zip`);
  const processingDir = path.join(rootProcessingDir, sessionId);

  if (fs.existsSync(sessionChunksDir)) {
    await safeUnlink(sessionChunksDir);
  }
  if (fs.existsSync(zipFilePath)) {
    await safeUnlink(zipFilePath);
  }
  if (fs.existsSync(processingDir)) {
    await safeUnlink(processingDir);
  }

  // 4. Cập nhật trạng thái StoryImportSession trong database thành cancelled
  let dbSession = null;
  try {
    dbSession = await db.storyImportSession.findUnique({
      where: { session_id: sessionId },
    });

    if (dbSession) {
      await db.storyImportSession.update({
        where: { id: dbSession.id },
        data: {
          status: "cancelled",
          completed_at: new Date(),
          error_message: "Phiên tải lên đã bị hủy và dọn dẹp bởi người dùng.",
        },
      });
    }
  } catch (err) {
    console.warn(`[ChunkUpload] Lỗi cập nhật trạng thái cancelled cho session ${sessionId}:`, err.message);
  }

  return {
    sessionId,
    message: "Đã hủy phiên tải lên và dọn dẹp toàn bộ dữ liệu tạm trên server thành công",
    importSessionId: dbSession?.id || null,
  };
}

export default {
  initChunkSession,
  getChunkStatus,
  saveChunk,
  completeChunkUpload,
  cancelImportSession,
};
