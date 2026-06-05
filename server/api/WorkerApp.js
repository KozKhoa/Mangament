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

console.log(`🚀 Worker Background Process is initialized and listening to queues.`);
