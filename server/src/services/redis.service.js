import { redis } from "../configs/redis.js";

const REDIS_TTL = 60 * 30; // 15 minutes

const version = {
  get: async (key) => {
    const versionKey = `version:${key}`;
    let version = await redis.get(versionKey);

    if (!version) {
      version = 1;
      await redis.set(versionKey, version);
    }

    return version;
  },

  incr: async (key) => {
    await redis.incr(`version:${key}`);
  },
};

const stories = (storyId) => {
  const key = `stories:storyId=${storyId}`;
  return { get: () => version.get(key), incr: () => version.incr(key) };
};

const storyNodes = (storyNodeId) => {
  const key = `storyNodes:storyNodeId=${storyNodeId}`;
  return { get: () => version.get(key), incr: () => version.incr(key) };
};

const comments = (commentId) => {
  const key = ["comments", "commentId=" + commentId].join(":");
  return { get: () => version.get(key), incr: () => version.incr(key) };
};

const ratings = (ratingId) => {
  const key = ["ratings", "ratingId=" + ratingId].join(":");
  return { get: () => version.get(key), incr: () => version.incr(key) };
};

const histories = (historiesId) => {
  const key = ["histories", "historiesId=" + historiesId].join(":");
  return { get: () => version.get(key), incr: () => version.incr(key) };
};

const favourites = (favouriteId) => {
  const key = ["favourites", "favouriteId=" + favouriteId].join(":");
  return { get: () => version.get(key), incr: () => version.incr(key) };
};

const users = (userId) => {
  const key = ["users", "userId=" + userId].join(":");
  return { get: () => version.get("users"), incr: () => version.incr("users") };
};

const admin = () => ({ get: () => version.get("admin"), incr: () => version.incr("admin") });

const authors = () => ({ get: () => version.get("authors"), incr: () => version.incr("authors") });

const image = (url) => {
  const key = `image:url=${url}`;
  return { get: () => version.get(key), incr: () => version.incr(key) };
};

const redisService = { stories, storyNodes, comments, ratings, histories, favourites, users, admin, image, authors };

export default redisService;
