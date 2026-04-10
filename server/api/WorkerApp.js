import { initRedis } from "./configs/redis.js";

// Validate and initialize shared resources
initRedis();

console.log("Worker process is starting with NODE_ENV =", process.env.NODE_ENV);

// Import all workers to register them
import "./workers/image.worker.js";
import "./workers/mail.worker.js";
import "./workers/story.worker.js";

console.log(`🚀 Worker Background Process is initialized and listening to queues.`);
