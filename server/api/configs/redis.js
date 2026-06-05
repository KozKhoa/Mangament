import Redis from "ioredis";

const globalForRedis = globalThis;

export const redis =
  globalForRedis.redis ||
  new Redis(process.env.REDIS_URL, {
    lazyConnect: true,
    maxRetriesPerRequest: 3,
    enableOfflineQueue: false,
  });

// export const redis = new Redis(process.env.REDIS_URL, {
//   lazyConnect: true,
//   maxRetriesPerRequest: 3,
//   enableOfflineQueue: false,
// });

if (process.env.NODE_ENV !== "production") {
  globalForRedis.redis = redis;
}

export async function connectToRedis() {
  try {
    console.log("▪️▪️▪️Connecting to Redis...");
    await redis.connect();
    await redis.ping();
    console.log("✅ Redis connected");
  } catch (err) {
    console.error("❌ Redis connection failed", err);
    process.exit(1);
  }
}
