#!/usr/bin/env node

/**
 * Script kiểm thử tải lên file ZIP thực tế bằng cơ chế Chunked / Resumable Upload.
 *
 * Cách chạy:
 *   node scripts/test-chunk-upload/index.js [path-to-file.zip] [options]
 *
 * Ví dụ:
 *   node scripts/test-chunk-upload/index.js /home/khoa/Downloads/truyen_tranh.zip
 *   node scripts/test-chunk-upload/index.js -f ./my_pack.zip --chunk-size 10
 *   node scripts/test-chunk-upload/index.js -f ./huge_2gb.zip -t "your_admin_jwt_token"
 *
 * Tùy chọn:
 *   --file, -f <path>        Đường dẫn file .zip thực tế trên máy
 *   --chunk-size, -c <MB>    Kích thước mỗi chunk tính theo MB (Mặc định: 10MB)
 *   --url, -u <baseUrl>      URL của server API (Mặc định: http://localhost:5000)
 *   --token, -t <token>      Access Token admin (Mặc định lấy từ ADMIN_TOKEN trong .env)
 *   --api-key, -k <key>      API Key nếu môi trường yêu cầu (Mặc định từ API_KEY trong .env)
 *   --no-cleanup             Không xóa file zip sau khi worker xử lý xong (giữ lại trong completed)
 *   --help, -h               Hiển thị hướng dẫn
 */

import fs from "fs";
import path from "path";
import crypto from "crypto";
import { fileURLToPath } from "url";
import dotenvFlow from "dotenv-flow";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Nạp biến môi trường từ server/api
dotenvFlow.config({
  path: path.resolve(__dirname, "../../"),
  node_env: process.env.NODE_ENV || "development",
  silent: true,
});

// Format byte sang dung lượng dễ đọc
function formatBytes(bytes) {
  if (bytes === 0) return "0 Bytes";
  const k = 1024;
  const sizes = ["Bytes", "KB", "MB", "GB", "TB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${(bytes / Math.pow(k, i)).toFixed(2)} ${sizes[i]}`;
}

// Hàm tính hash MD5 của file nhanh
async function calculateFileHash(filePath) {
  return new Promise((resolve, reject) => {
    const hash = crypto.createHash("md5");
    const stream = fs.createReadStream(filePath);
    stream.on("data", (chunk) => hash.update(chunk));
    stream.on("end", () => resolve(hash.digest("hex")));
    stream.on("error", reject);
  });
}

// Phân tích tham số dòng lệnh
function parseCliArgs() {
  const args = process.argv.slice(2);
  const options = {
    filePath: null,
    chunkSizeMB: 10,
    apiUrl: process.env.API_URL || `http://localhost:${process.env.APP_PORT || 5000}`,
    token: (process.env.ADMIN_TOKEN || "").replace(/^['"]|['"]$/g, "").trim(),
    apiKey: process.env.API_KEY || "",
    cleanup: true,
  };

  for (let i = 0; i < args.length; i++) {
    const arg = args[i];

    if (arg === "-h" || arg === "--help") {
      printHelp();
      process.exit(0);
    } else if (arg === "-f" || arg === "--file") {
      options.filePath = args[++i];
    } else if (arg === "-c" || arg === "--chunk-size") {
      options.chunkSizeMB = Number(args[++i]) || 10;
    } else if (arg === "-u" || arg === "--url") {
      options.apiUrl = args[++i];
    } else if (arg === "-t" || arg === "--token") {
      options.token = args[++i];
    } else if (arg === "-k" || arg === "--api-key") {
      options.apiKey = args[++i];
    } else if (arg === "--no-cleanup") {
      options.cleanup = false;
    } else if (!arg.startsWith("-") && !options.filePath) {
      options.filePath = arg;
    }
  }

  return options;
}

function printHelp() {
  console.log(`
======================================================================
  MANGAMENT - SCRIPT TEST CHUNKED UPLOAD VỚI FILE THỰC TẾ
======================================================================

Cách dùng:
  node scripts/test-chunk-upload/index.js <đường_dẫn_file.zip> [options]

Ví dụ:
  node scripts/test-chunk-upload/index.js /home/user/my_manga.zip
  node scripts/test-chunk-upload/index.js -f ./pack.zip -c 5 -u http://localhost:5000

Tùy chọn:
  -f, --file <path>        Đường dẫn file .zip thực tế trên máy
  -c, --chunk-size <MB>    Kích thước mỗi chunk (Mặc định: 10MB)
  -u, --url <url>          Base URL API (Mặc định: http://localhost:5000)
  -t, --token <token>      Access token (Mặc định: Lấy từ ADMIN_TOKEN trong .env)
  -k, --api-key <key>      Header x-api-key nếu môi trường yêu cầu
  --no-cleanup             Giữ file ZIP lại sau khi worker import xong
  -h, --help               Xem hướng dẫn này
`);
}

async function main() {
  const options = parseCliArgs();

  if (!options.filePath) {
    console.error("\x1b[31m❌ Lỗi: Bạn chưa cung cấp đường dẫn file .zip để test.\x1b[0m");
    console.log("👉 Ví dụ: node scripts/test-chunk-upload/index.js /duong/dan/toi/file_truyen.zip");
    console.log("👉 Dùng: node scripts/test-chunk-upload/index.js --help để xem chi tiết.\n");
    process.exit(1);
  }

  const resolvedPath = path.resolve(options.filePath);

  if (!fs.existsSync(resolvedPath)) {
    console.error(`\x1b[31m❌ File không tồn tại: ${resolvedPath}\x1b[0m`);
    process.exit(1);
  }

  if (!resolvedPath.toLowerCase().endsWith(".zip")) {
    console.error(`\x1b[31m❌ File phải có định dạng .zip: ${resolvedPath}\x1b[0m`);
    process.exit(1);
  }

  const stat = await fs.promises.stat(resolvedPath);
  if (!stat.isFile()) {
    console.error(`\x1b[31m❌ Đường dẫn cung cấp không phải là một file: ${resolvedPath}\x1b[0m`);
    process.exit(1);
  }

  const fileSize = stat.size;
  const fileName = path.basename(resolvedPath);
  const chunkSize = options.chunkSizeMB * 1024 * 1024;
  const totalChunks = Math.ceil(fileSize / chunkSize);

  const cleanBaseUrl = options.apiUrl.replace(/\/+$/, "");

  console.log("\n======================================================================");
  console.log("   🚀 BẮT ĐẦU TEST CHUNKED UPLOAD VỚI FILE THỰC TẾ");
  console.log("======================================================================");
  console.log(`📁 File thực tế : ${resolvedPath}`);
  console.log(`🏷️  Tên file     : ${fileName}`);
  console.log(`📊 Dung lượng   : ${formatBytes(fileSize)} (${fileSize.toLocaleString()} bytes)`);
  console.log(`🧩 Cấu hình     : ${options.chunkSizeMB} MB/chunk  -->  Tổng cộng: ${totalChunks} chunks`);
  console.log(`🌐 Server API   : ${cleanBaseUrl}`);
  console.log(`🔑 Token        : ${options.token ? `${options.token.slice(0, 10)}... (Đã có token)` : "(Không có token)"}`);
  console.log("----------------------------------------------------------------------\n");

  const headers = {};
  if (options.token) {
    headers["Authorization"] = `Bearer ${options.token}`;
  }
  if (options.apiKey) {
    headers["x-api-key"] = options.apiKey;
  }

  // 1. Tính hash định danh file
  process.stdout.write("⏳ Đang tính toán mã hash của file để test tính năng Resume...");
  const fileHash = await calculateFileHash(resolvedPath);
  console.log(`\r✅ Mã hash file (MD5): \x1b[36m${fileHash}\x1b[0m`);

  // 2. Gọi API INIT
  console.log("\n[1/3] 📡 Đang gọi POST /admin/stories/upload-zip/chunk/init ...");
  let initData;
  try {
    const initRes = await fetch(`${cleanBaseUrl}/admin/stories/upload-zip/chunk/init`, {
      method: "POST",
      headers: {
        ...headers,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        fileName,
        fileSize,
        totalChunks,
        chunkSize,
        fileHash,
        cleanupAfterProcessing: options.cleanup,
      }),
    });

    const initJson = await initRes.json();
    if (!initRes.ok) {
      throw new Error(`[HTTP ${initRes.status}] ${initJson.message || JSON.stringify(initJson)}`);
    }

    initData = initJson.data;
  } catch (err) {
    console.error(`\x1b[31m❌ Lỗi khi khởi tạo phiên upload: ${err.message}\x1b[0m`);
    console.error("👉 Gợi ý: Hãy kiểm tra xem server backend đã chạy chưa (ví dụ: npm run dev) và Token admin có hợp lệ không.\n");
    process.exit(1);
  }

  const { sessionId, isResumed, uploadedChunks: alreadyUploaded = [] } = initData;
  const uploadedSet = new Set(alreadyUploaded);

  console.log(`   Session ID  : \x1b[33m${sessionId}\x1b[0m`);
  console.log(
    `   Trạng thái  : ${isResumed ? `\x1b[32m♻️  Được khôi phục (Resume) - Đã có sẵn ${alreadyUploaded.length}/${totalChunks} chunks\x1b[0m` : "🆕 Phiên tải mới"}`,
  );

  // 3. Tải lên từng chunk
  console.log(`\n[2/3] 📤 Bắt đầu tải lên ${totalChunks} chunks...`);
  const fileHandle = await fs.promises.open(resolvedPath, "r");

  const startTime = Date.now();
  let uploadedBytes = 0;

  try {
    for (let i = 0; i < totalChunks; i++) {
      const chunkStart = i * chunkSize;
      const chunkEnd = Math.min(chunkStart + chunkSize, fileSize);
      const chunkLen = chunkEnd - chunkStart;

      if (uploadedSet.has(i)) {
        uploadedBytes += chunkLen;
        console.log(`   ⏩ [Chunk ${i + 1}/${totalChunks}] Đã tồn tại trước đó -> Bỏ qua`);
        continue;
      }

      const chunkBuffer = Buffer.alloc(chunkLen);
      await fileHandle.read(chunkBuffer, 0, chunkLen, chunkStart);

      const chunkBlob = new Blob([chunkBuffer]);
      const formData = new FormData();
      formData.append("sessionId", sessionId);
      formData.append("chunkIndex", i.toString());
      formData.append("chunk", chunkBlob, `chunk_${i}.bin`);

      const chunkStartTime = Date.now();
      const chunkRes = await fetch(`${cleanBaseUrl}/admin/stories/upload-zip/chunk/upload`, {
        method: "POST",
        headers: {
          ...headers,
        },
        body: formData,
      });

      const chunkJson = await chunkRes.json();
      if (!chunkRes.ok) {
        throw new Error(`Lỗi tải chunk ${i}: [HTTP ${chunkRes.status}] ${chunkJson.message || JSON.stringify(chunkJson)}`);
      }

      uploadedBytes += chunkLen;
      const chunkDuration = Date.now() - chunkStartTime;
      const percent = Math.round((uploadedBytes / fileSize) * 100);
      const speedMBs = (chunkLen / 1024 / 1024 / (chunkDuration / 1000 || 0.001)).toFixed(2);

      console.log(`   ✅ [Chunk ${i + 1}/${totalChunks}] (${percent}%) ${formatBytes(chunkLen)} trong ${chunkDuration}ms (${speedMBs} MB/s)`);
    }
  } finally {
    await fileHandle.close();
  }

  const totalUploadTime = ((Date.now() - startTime) / 1000).toFixed(2);
  console.log(`\n🎉 Đã tải lên toàn bộ ${totalChunks} chunks trong ${totalUploadTime} giây!`);

  // 4. Kiểm tra trạng thái hoàn tất qua API STATUS
  console.log("\n[Kiểm tra] 🔍 Đang gọi GET /admin/stories/upload-zip/chunk/status ...");
  const statusRes = await fetch(`${cleanBaseUrl}/admin/stories/upload-zip/chunk/status?sessionId=${sessionId}`, {
    method: "GET",
    headers,
  });
  const statusJson = await statusRes.json();
  if (statusRes.ok) {
    console.log(
      `   Đã nhận đủ trên server: ${statusJson.data?.uploadedCount}/${statusJson.data?.totalChunks} chunks (isComplete: ${statusJson.data?.isComplete})`,
    );
  }

  // 5. Gọi API COMPLETE để ghép file
  console.log("\n[3/3] ⚙️  Đang gọi POST /admin/stories/upload-zip/chunk/complete để ghép file...");
  const completeStartTime = Date.now();

  const completeRes = await fetch(`${cleanBaseUrl}/admin/stories/upload-zip/chunk/complete`, {
    method: "POST",
    headers: {
      ...headers,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      sessionId,
      cleanupAfterProcessing: options.cleanup,
    }),
  });

  const completeJson = await completeRes.json();
  if (!completeRes.ok) {
    throw new Error(`[HTTP ${completeRes.status}] ${completeJson.message || JSON.stringify(completeJson)}`);
  }

  const completeDuration = ((Date.now() - completeStartTime) / 1000).toFixed(2);

  console.log("\n======================================================================");
  console.log("   🏆 KẾT QUẢ TEST THÀNH CÔNG RỰC RỠ!");
  console.log("======================================================================");
  console.log(`✅ Thông điệp server : ${completeJson.message}`);
  console.log(`📦 File đã ghép      : ${completeJson.data?.zipPath}`);
  console.log(`📊 Dung lượng file   : ${formatBytes(completeJson.data?.fileSize || fileSize)}`);
  console.log(`⏱️  Thời gian ghép file: ${completeDuration} giây`);
  console.log("🛠️  Hàng đợi Worker  : Đã đẩy job 'batch-import-zip' vào BullMQ thành công!");
  console.log("======================================================================\n");
}

main().catch((err) => {
  console.error(`\n\x1b[31m❌ Quá trình test thất bại: ${err.message}\x1b[0m\n`);
  process.exit(1);
});
