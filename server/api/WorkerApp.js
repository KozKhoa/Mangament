import { connectToRedis } from "./configs/redis.js";
import { connectToMongoDB } from "./configs/logs-db.js";

// Validate and initialize shared resources
connectToRedis();
connectToMongoDB();

console.log("Worker process is starting with NODE_ENV =", process.env.NODE_ENV);

// Import all workers to register them
import "./workers/image.worker.js";
import "./workers/mail.worker.js";
import "./workers/story.worker.js";
import "./workers/log.worker.js";

console.log(`🚀 Worker Background Process is initialized and listening to queues.`);
