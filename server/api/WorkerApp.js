import { connectToRedis } from "./configs/redis.js";
import { connectToMongoDB } from "./configs/logs-db.js";

// Validate and initialize shared resources
connectToRedis();
connectToMongoDB();

console.log("Worker process is starting with NODE_ENV =", process.env.NODE_ENV);

// Import all workers to register them
import "./worker/handlers/image.worker.js";
import "./worker/handlers/mail.worker.js";
import "./worker/handlers/story.worker.js";
import "./worker/handlers/log.worker.js";

import { cleanupStaleStagingAndSessions } from "./src/services/chunk-upload.service.js";

// Chạy quét dọn các session bị kẹt (>48h) và file staging mồ côi (>24h) khi worker khởi động
cleanupStaleStagingAndSessions().catch((err) => console.warn("[WorkerApp] Lỗi dọn dẹp khi khởi động:", err.message));

// Lên lịch quét dọn định kỳ mỗi 1 giờ
const cleanupInterval = setInterval(
  () => {
    cleanupStaleStagingAndSessions().catch((err) => console.warn("[WorkerApp] Lỗi dọn dẹp định kỳ:", err.message));
  },
  60 * 60 * 1000,
);
if (cleanupInterval.unref) cleanupInterval.unref();

console.log(`🚀 Worker Background Process is initialized and listening to queues.`);
