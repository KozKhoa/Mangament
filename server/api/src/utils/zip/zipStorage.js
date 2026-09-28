import fs from "fs";
import path from "path";
import crypto from "crypto";
import { execFile } from "child_process";
import { promisify } from "util";
import { fileURLToPath } from "url";
import { CreateError } from "../ErrorHandle.js";

const execFileAsync = promisify(execFile);

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * Resolves the temporary storage root directory (TEMP_DIR)
 * Structure:
 * - <TEMP_DIR>/uploads
 * - <TEMP_DIR>/processing
 * - <TEMP_DIR>/completed
 */
export function getTempDir() {
  const root = process.env.TEMP_DIR ? path.resolve(process.env.TEMP_DIR) : path.resolve(__dirname, "../../../../temp");

  const uploadsDir = path.join(root, "uploads");
  const processingDir = path.join(root, "processing");
  const completedDir = path.join(root, "completed");
  const chunksDir = path.join(uploadsDir, "chunks");
  const stagingDir = path.join(uploadsDir, "staging");

  fs.mkdirSync(uploadsDir, { recursive: true });
  fs.mkdirSync(processingDir, { recursive: true });
  fs.mkdirSync(completedDir, { recursive: true });
  fs.mkdirSync(chunksDir, { recursive: true });
  fs.mkdirSync(stagingDir, { recursive: true });

  return {
    root,
    uploadsDir,
    processingDir,
    completedDir,
    chunksDir,
    stagingDir,
  };
}

/**
 * Returns the directory path for storing chunks of a specific session or root chunks directory.
 */
export function getChunksDir(sessionId) {
  const { chunksDir } = getTempDir();
  if (!sessionId) return chunksDir;
  return path.join(chunksDir, sessionId);
}

/**
 * Checks available disk space on the given path.
 *
 * @param {string} targetPath - Directory to check
 * @param {number} requiredBytes - Bytes needed for writing/extracting
 * @returns {Promise<{ hasSpace: boolean, availableBytes: number, freeBytes: number, minBufferBytes: number }>}
 */
export async function checkFreeDiskSpace(targetPath, requiredBytes = 0) {
  try {
    const stats = await fs.promises.statfs(targetPath);
    const availableBytes = stats.bavail * stats.bsize;
    const freeBytes = stats.bfree * stats.bsize;

    const minBufferMB = Number(process.env.MIN_DISK_FREE_SPACE_MB) || 1024; // Default 1GB safety buffer
    const minBufferBytes = minBufferMB * 1024 * 1024;

    const hasSpace = availableBytes - requiredBytes >= minBufferBytes;

    return {
      hasSpace,
      availableBytes,
      freeBytes,
      minBufferBytes,
    };
  } catch (error) {
    // If statfs fails for any reason (e.g. mocked filesystem in test), allow proceed with warning
    console.warn(`[DiskStorage] Không thể kiểm tra dung lượng ổ đĩa qua statfs: ${error.message}`);
    return {
      hasSpace: true,
      availableBytes: Infinity,
      freeBytes: Infinity,
      minBufferBytes: 0,
    };
  }
}

/**
 * Safely removes a file or directory if it exists.
 */
export async function safeUnlink(filePath) {
  if (!filePath) return;
  try {
    const stat = await fs.promises.stat(filePath);
    if (stat.isDirectory()) {
      await fs.promises.rm(filePath, { recursive: true, force: true });
    } else {
      await fs.promises.unlink(filePath);
    }
  } catch {
    // Ignore errors when file does not exist
  }
}

/**
 * Custom Multer storage engine that streams large zip files to disk
 * while monitoring available disk space in real-time.
 *
 * If disk space runs out or ENOSPC occurs:
 * Immediately aborts, unlinks the partial zip file, and throws:
 * "File quá lớn hoặc dung lượng đĩa không đủ"
 */
export function createZipDiskStorageEngine() {
  return {
    _handleFile(req, file, cb) {
      const { uploadsDir } = getTempDir();
      const sessionId = req.body?.sessionId || `session_${Date.now()}_${crypto.randomUUID().slice(0, 8)}`;
      const safeOriginalName = path.basename(file.originalname || "story_import.zip");
      const ext = path.extname(safeOriginalName).toLowerCase() || ".zip";
      const targetFilename = `${sessionId}${ext}`;
      const destinationFilePath = path.join(uploadsDir, targetFilename);

      let writtenBytes = 0;
      let hasAborted = false;
      let writeStream = null;

      const abortAndCleanup = async (errorMessage, statusCode = 413) => {
        if (hasAborted) return;
        hasAborted = true;

        try {
          if (file.stream) {
            file.stream.unpipe();
            file.stream.destroy();
          }
          if (writeStream) {
            writeStream.destroy();
          }
        } catch {
          // ignore cleanup errors
        }

        await safeUnlink(destinationFilePath);

        const error = new Error(errorMessage || "File quá lớn hoặc dung lượng đĩa không đủ");
        error.status = statusCode;
        return cb(error);
      };

      // 1. Initial disk space verification
      checkFreeDiskSpace(uploadsDir)
        .then((space) => {
          if (!space.hasSpace) {
            return abortAndCleanup("Dung lượng đĩa không đủ để bắt đầu tải file", 507);
          }

          writeStream = fs.createWriteStream(destinationFilePath);

          writeStream.on("error", async (err) => {
            if (err.code === "ENOSPC") {
              return abortAndCleanup("File quá lớn hoặc dung lượng đĩa không đủ (hết dung lượng lưu trữ)", 507);
            }
            return abortAndCleanup(`Lỗi ghi file vào đĩa: ${err.message}`, 500);
          });

          file.stream.on("data", (chunk) => {
            if (hasAborted) return;
            writtenBytes += chunk.length;

            // Every ~100MB written, check available space
            if (writtenBytes % (100 * 1024 * 1024) < chunk.length) {
              checkFreeDiskSpace(uploadsDir).then((sp) => {
                if (!sp.hasSpace && !hasAborted) {
                  abortAndCleanup("File quá lớn hoặc dung lượng đĩa không đủ (hết dung lượng ổ đĩa khi đang tải)", 507);
                }
              });
            }
          });

          file.stream.on("error", (err) => {
            if (err.code === "ENOSPC" || (err.message && err.message.includes("No space left on device"))) {
              return abortAndCleanup("File quá lớn hoặc dung lượng đĩa không đủ (hết dung lượng lưu trữ)", 507);
            }
            abortAndCleanup(`Lỗi truyền tải file: ${err.message}`, 400);
          });

          writeStream.on("finish", () => {
            if (hasAborted) return;
            cb(null, {
              destination: uploadsDir,
              filename: targetFilename,
              path: destinationFilePath,
              size: writtenBytes,
              sessionId,
              originalname: safeOriginalName,
            });
          });

          file.stream.pipe(writeStream);
        })
        .catch((err) => {
          abortAndCleanup(`Lỗi khởi tạo lưu trữ đĩa: ${err.message}`, 500);
        });
    },

    _removeFile(req, file, cb) {
      if (file && file.path) {
        safeUnlink(file.path)
          .then(() => cb(null))
          .catch(cb);
      } else {
        cb(null);
      }
    },
  };
}

/**
 * Downloads a zip file from a remote URL directly to disk storage with streaming
 * and disk space monitoring.
 *
 * @param {string} url - Remote URL of the zip file
 * @param {object} [options]
 * @returns {Promise<{ filePath: string, filename: string, size: number, sessionId: string }>}
 */
export async function downloadZipFromUrl(url, options = {}) {
  if (!url) {
    throw CreateError(400, "Vui lòng cung cấp URL tải file zip");
  }

  const { uploadsDir } = getTempDir();
  const sessionId = options.sessionId || `session_${Date.now()}_${crypto.randomUUID().slice(0, 8)}`;
  const filename = `${sessionId}.zip`;
  const destinationFilePath = path.join(uploadsDir, filename);

  const initialSpace = await checkFreeDiskSpace(uploadsDir);
  if (!initialSpace.hasSpace) {
    throw CreateError(507, "Dung lượng đĩa không đủ để bắt đầu tải file");
  }

  let response;
  try {
    response = await fetch(url);
  } catch (err) {
    throw CreateError(400, `Không thể kết nối đến URL tải file: ${err.message}`);
  }

  if (!response.ok) {
    throw CreateError(response.status || 400, `URL trả về lỗi ${response.status}: ${response.statusText}`);
  }

  const contentLength = Number(response.headers.get("content-length"));
  if (contentLength && !Number.isNaN(contentLength)) {
    const spaceCheck = await checkFreeDiskSpace(uploadsDir, contentLength);
    if (!spaceCheck.hasSpace) {
      throw CreateError(507, "File quá lớn hoặc dung lượng đĩa không đủ (Content-Length vượt quá dung lượng khả dụng)");
    }
  }

  const writeStream = fs.createWriteStream(destinationFilePath);
  let writtenBytes = 0;
  let hasAborted = false;

  const abortAndCleanup = async (errorMessage, statusCode = 507) => {
    if (hasAborted) return;
    hasAborted = true;

    try {
      writeStream.destroy();
    } catch {
      // ignore cleanup errors
    }

    await safeUnlink(destinationFilePath);
    throw CreateError(statusCode, errorMessage);
  };

  try {
    const reader = response.body.getReader();

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      writtenBytes += value.length;

      // Periodically check remaining disk space
      if (writtenBytes % (100 * 1024 * 1024) < value.length) {
        const currentSpace = await checkFreeDiskSpace(uploadsDir);
        if (!currentSpace.hasSpace) {
          await reader.cancel();
          await abortAndCleanup("File quá lớn hoặc dung lượng đĩa không đủ (hết dung lượng ổ đĩa khi đang tải)", 507);
        }
      }

      const canWrite = writeStream.write(value);
      if (!canWrite) {
        await new Promise((resolve) => writeStream.once("drain", resolve));
      }
    }

    await new Promise((resolve, reject) => {
      writeStream.end((err) => {
        if (err) reject(err);
        else resolve();
      });
    });

    return {
      filePath: destinationFilePath,
      filename,
      size: writtenBytes,
      sessionId,
      url,
    };
  } catch (err) {
    await abortAndCleanup(err.message || "Lỗi trong quá trình tải và ghi file zip", err.status || 507);
  }
}

/**
 * Tự động phát hiện và sửa lỗi Mojibake (UTF-8 bị giải mã nhầm thành CP437/Latin1)
 * Thường xảy ra khi người dùng nén zip trên Windows không bật cờ UTF-8.
 *
 * @param {string} str
 * @returns {string}
 */
export function fixMojibake(str) {
  if (!str) return str;
  try {
    const decoded = Buffer.from(str, "latin1").toString("utf8");
    // Nếu giải mã thành công không có ký tự lỗi \ufffd và chuỗi khác chuỗi gốc
    if (decoded && !decoded.includes("\ufffd") && decoded !== str) {
      return decoded;
    }
  } catch {
    // Giữ nguyên chuỗi nếu decode lỗi
  }
  return str;
}

/**
 * Đệ quy chuẩn hóa toàn bộ cây thư mục và tên file sau khi giải nén:
 * 1. Khắc phục tên bị lỗi font ký tự lạ (Mojibake: ChÆ°Æ¡ng -> Chương)
 * 2. Chuẩn hóa chuỗi Unicode sang chuẩn NFC (tránh lỗi lệch chuẩn NFD từ macOS)
 *
 * @param {string} dirPath - Thư mục đã giải nén
 */
export async function normalizeExtractedDirectory(dirPath) {
  if (!fs.existsSync(dirPath)) return;

  async function walkAndRename(currentDir) {
    const entries = await fs.promises.readdir(currentDir, { withFileTypes: true });
    for (const entry of entries) {
      const oldPath = path.join(currentDir, entry.name);

      // Đệ quy xử lý các thư mục con trước (depth-first)
      if (entry.isDirectory()) {
        await walkAndRename(oldPath);
      }

      let newName = fixMojibake(entry.name);
      newName = newName.normalize("NFC");

      if (newName !== entry.name) {
        const newPath = path.join(currentDir, newName);
        if (!fs.existsSync(newPath)) {
          try {
            await fs.promises.rename(oldPath, newPath);
            console.log(`[ZipStorage] ✅ Đã sửa tên file/thư mục tiếng Việt: "${entry.name}" -> "${newName}"`);
          } catch (renameErr) {
            console.warn(`[ZipStorage] Không thể đổi tên "${entry.name}": ${renameErr.message}`);
          }
        }
      }
    }
  }

  await walkAndRename(dirPath);
}

/**
 * Extracts a zip archive to a target processing directory using 7z or unzip
 * with strict UTF-8 preservation and post-extraction Vietnamese name repair.
 *
 * @param {string} zipFilePath - Path to zip archive
 * @param {string} destinationDir - Target extraction folder
 */
export async function extractZipArchive(zipFilePath, destinationDir) {
  if (!fs.existsSync(zipFilePath)) {
    throw new Error(`File zip không tồn tại tại đường dẫn: ${zipFilePath}`);
  }

  await fs.promises.mkdir(destinationDir, { recursive: true });

  const space = await checkFreeDiskSpace(destinationDir);
  if (!space.hasSpace) {
    await safeUnlink(destinationDir);
    throw CreateError(507, "Dung lượng ổ đĩa không đủ để giải nén file zip");
  }

  let extracted = false;

  // 1. Thử giải nén bằng 7z kèm cờ ép chuẩn UTF-8 (-mcu=on)
  try {
    // 7z x -y -mcu=on -o<outDir> <zipPath>
    await execFileAsync("7z", ["x", "-y", "-mcu=on", `-o${destinationDir}`, zipFilePath]);
    console.log(`[ZipStorage] Giải nén thành công bằng 7z (-mcu=on): ${zipFilePath} -> ${destinationDir}`);
    extracted = true;
  } catch (err7zMcu) {
    console.warn(`[ZipStorage] 7z (-mcu=on) không khả dụng (${err7zMcu.message}), thử 7z mặc định...`);
    try {
      await execFileAsync("7z", ["x", "-y", `-o${destinationDir}`, zipFilePath]);
      console.log(`[ZipStorage] Giải nén thành công bằng 7z: ${zipFilePath} -> ${destinationDir}`);
      extracted = true;
    } catch (err7z) {
      console.warn(`[ZipStorage] 7z thất bại (${err7z.message}), chuyển sang dùng unzip...`);
    }
  }

  // 2. Fallback sang lệnh unzip (thử -O UTF-8 trước để giải mã tên file tiếng Việt đúng chuẩn)
  if (!extracted) {
    try {
      // unzip -q -o -O UTF-8 <zipPath> -d <outDir>
      await execFileAsync("unzip", ["-q", "-o", "-O", "UTF-8", zipFilePath, "-d", destinationDir]);
      console.log(`[ZipStorage] Giải nén thành công bằng unzip (-O UTF-8): ${zipFilePath} -> ${destinationDir}`);
      extracted = true;
    } catch (errUnzipUtf8) {
      console.warn(`[ZipStorage] unzip (-O UTF-8) thất bại (${errUnzipUtf8.message}), thử unzip mặc định...`);
      try {
        // unzip -q -o <zipPath> -d <outDir>
        await execFileAsync("unzip", ["-q", "-o", zipFilePath, "-d", destinationDir]);
        console.log(`[ZipStorage] Giải nén thành công bằng unzip mặc định: ${zipFilePath} -> ${destinationDir}`);
        extracted = true;
      } catch (errUnzip) {
        await safeUnlink(destinationDir);
        throw new Error(`Không thể giải nén file zip: ${errUnzip.message || errUnzipUtf8.message}`, { cause: errUnzip });
      }
    }
  }

  // 3. Tự động kiểm tra và sửa lỗi tên file/thư mục tiếng Việt (Mojibake / NFC)
  try {
    await normalizeExtractedDirectory(destinationDir);
  } catch (normErr) {
    console.warn(`[ZipStorage] Cảnh báo khi chuẩn hóa tên tiếng Việt sau giải nén: ${normErr.message}`);
  }

  return { success: true, destinationDir };
}

/**
 * Recursively searches a directory for spreadsheet files (.csv, .xlsx, .xls)
 * Prioritizes files named 'stories.csv' or containing 'story'.
 *
 * @param {string} dirPath - Extracted directory
 * @returns {Promise<string|null>} Path to the primary CSV or spreadsheet file
 */
export async function findCsvInDirectory(dirPath) {
  const spreadsheetFiles = [];

  async function walk(currentDir) {
    const entries = await fs.promises.readdir(currentDir, { withFileTypes: true });
    for (const entry of entries) {
      const fullPath = path.join(currentDir, entry.name);
      if (entry.isDirectory()) {
        await walk(fullPath);
      } else if (entry.isFile()) {
        const ext = path.extname(entry.name).toLowerCase();
        if ([".csv", ".xlsx", ".xls"].includes(ext)) {
          spreadsheetFiles.push(fullPath);
        }
      }
    }
  }

  await walk(dirPath);

  if (spreadsheetFiles.length === 0) return null;

  // Prioritize files named 'stories.csv', then any '.csv', then '.xlsx'
  const prioritized = spreadsheetFiles.sort((a, b) => {
    const aName = path.basename(a).toLowerCase();
    const bName = path.basename(b).toLowerCase();

    if (aName === "stories.csv") return -1;
    if (bName === "stories.csv") return 1;
    if (aName.includes("story") && aName.endsWith(".csv")) return -1;
    if (bName.includes("story") && bName.endsWith(".csv")) return 1;
    if (aName.endsWith(".csv") && !bName.endsWith(".csv")) return -1;
    if (!aName.endsWith(".csv") && bName.endsWith(".csv")) return 1;
    return 0;
  });

  return prioritized[0];
}

/**
 * Handles post-processing cleanup or archive movement:
 * - If cleanupAfterProcessing is true:
 *   Deletes the zip file and removes the extracted processing directory.
 * - If cleanupAfterProcessing is false:
 *   Moves the zip file to <TEMP_DIR>/completed/<sessionId>/ and deletes the processing directory.
 */
export async function cleanupOrMoveProcessedZip({ zipFilePath, processingDir, sessionId, cleanupAfterProcessing }) {
  const shouldCleanup = cleanupAfterProcessing !== undefined ? Boolean(cleanupAfterProcessing) : process.env.CLEANUP_ZIP_AFTER_PROCESSING !== "false";

  const { completedDir } = getTempDir();

  // Always clean up the extracted processing directory after worker finishes import
  if (processingDir && fs.existsSync(processingDir)) {
    try {
      await safeUnlink(processingDir);
      console.log(`[ZipStorage] Đã dọn dẹp thư mục processing: ${processingDir}`);
    } catch (err) {
      console.warn(`[ZipStorage] Không thể xóa thư mục processing: ${err.message}`);
    }
  }

  if (zipFilePath && fs.existsSync(zipFilePath)) {
    if (shouldCleanup) {
      try {
        await safeUnlink(zipFilePath);
        console.log(`[ZipStorage] Đã xóa file zip tạm thời sau khi xử lý: ${zipFilePath}`);
      } catch (err) {
        console.warn(`[ZipStorage] Không thể xóa file zip: ${err.message}`);
      }
    } else {
      try {
        const sessionCompletedDir = path.join(completedDir, sessionId || "archive");
        await fs.promises.mkdir(sessionCompletedDir, { recursive: true });
        const destZipPath = path.join(sessionCompletedDir, path.basename(zipFilePath));
        await fs.promises.rename(zipFilePath, destZipPath);
        console.log(`[ZipStorage] Đã chuyển file zip vào thư mục completed: ${destZipPath}`);
      } catch (err) {
        console.warn(`[ZipStorage] Không thể chuyển file zip sang completed: ${err.message}`);
      }
    }
  }
}

/**
 * Merges chunks sequentially into a target destination file with streaming.
 * Each chunk is deleted after being merged to conserve disk space.
 *
 * @param {object} params
 * @param {string} params.sessionId
 * @param {number} params.totalChunks
 * @param {string} params.targetFilePath
 * @returns {Promise<{ filePath: string, size: number }>}
 */
export async function mergeChunksSequentially({ sessionId, totalChunks, targetFilePath, onProgress }) {
  const sessionChunksDir = getChunksDir(sessionId);

  if (!fs.existsSync(sessionChunksDir)) {
    throw CreateError(404, `Thư mục chunk không tồn tại cho phiên ${sessionId}`);
  }

  await fs.promises.mkdir(path.dirname(targetFilePath), { recursive: true });

  const writeStream = fs.createWriteStream(targetFilePath, { flags: "w" });

  try {
    for (let i = 0; i < totalChunks; i++) {
      const chunkPath = path.join(sessionChunksDir, `chunk_${i}`);
      if (!fs.existsSync(chunkPath)) {
        throw CreateError(400, `Không tìm thấy chunk index ${i} tại ${chunkPath}`);
      }

      await new Promise((resolve, reject) => {
        const readStream = fs.createReadStream(chunkPath);
        readStream.on("error", reject);
        writeStream.on("error", reject);

        readStream.on("end", async () => {
          try {
            await safeUnlink(chunkPath);
            if (typeof onProgress === "function") {
              try {
                onProgress(i + 1, totalChunks);
              } catch {}
            }
            resolve();
          } catch (unlinkErr) {
            reject(unlinkErr);
          }
        });

        readStream.pipe(writeStream, { end: false });
      });
    }

    await new Promise((resolve, reject) => {
      writeStream.end((err) => {
        if (err) reject(err);
        else resolve();
      });
    });

    // Remove empty session chunks directory
    await safeUnlink(sessionChunksDir);

    const stat = await fs.promises.stat(targetFilePath);
    return {
      filePath: targetFilePath,
      size: stat.size,
    };
  } catch (error) {
    writeStream.destroy();
    await safeUnlink(targetFilePath);
    throw error;
  }
}

export default {
  getTempDir,
  getChunksDir,
  checkFreeDiskSpace,
  safeUnlink,
  createZipDiskStorageEngine,
  downloadZipFromUrl,
  extractZipArchive,
  normalizeExtractedDirectory,
  fixMojibake,
  findCsvInDirectory,
  cleanupOrMoveProcessedZip,
  mergeChunksSequentially,
};
