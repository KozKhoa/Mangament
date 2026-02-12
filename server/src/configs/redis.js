import Redis from "ioredis";

export const redis = new Redis(process.env.REDIS_URL, {
  lazyConnect: true,
  maxRetriesPerRequest: 3,
  enableOfflineQueue: false,
});

export async function initRedis() {
  try {
    await redis.connect();
    await redis.ping();
    console.log("Redis connected");
  } catch (err) {
    console.error("Redis connection failed", err);
    process.exit(1);
  }
}
