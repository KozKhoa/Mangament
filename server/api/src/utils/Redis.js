import { redis } from "../../configs/redis.js";

const version = {
  get: async (key) => {
    const versionKey = `version:${key}`;
    let ver = await redis.get(versionKey);

    if (!ver) {
      ver = 1;
      await redis.set(versionKey, ver);
    }

    return ver;
  },

  incr: async (key) => {
    return await redis.incr(`version:${key}`);
  },
};

const stories = (storyId) => {
  const isGlobal = !storyId;
  const key = isGlobal ? "stories" : `stories:storyId=${storyId}`;
  return {
    get: async () => {
      if (isGlobal) {
        let v = await redis.get("version:stories");
        if (!v) {
          const legacy = await redis.get("version:stories:storyId=undefined");
          v = legacy || 1;
          await redis.set("version:stories", v);
          await redis.set("version:stories:storyId=undefined", v);
        }
        return v;
      }
      return version.get(key);
    },
    incr: async () => {
      if (isGlobal) {
        await redis.incr("version:stories");
        await redis.incr("version:stories:storyId=undefined");
      } else {
        await version.incr(key);
      }
    },
  };
};

const storyNodes = (storyNodeId) => {
  const isGlobal = !storyNodeId;
  const key = isGlobal ? "storyNodes" : `storyNodes:storyNodeId=${storyNodeId}`;
  return {
    get: async () => {
      if (isGlobal) {
        let v = await redis.get("version:storyNodes");
        if (!v) {
          const legacy = await redis.get("version:storyNodes:storyNodeId=undefined");
          v = legacy || 1;
          await redis.set("version:storyNodes", v);
          await redis.set("version:storyNodes:storyNodeId=undefined", v);
        }
        return v;
      }
      return version.get(key);
    },
    incr: async () => {
      if (isGlobal) {
        await redis.incr("version:storyNodes");
        await redis.incr("version:storyNodes:storyNodeId=undefined");
      } else {
        await version.incr(key);
      }
    },
  };
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
  const isGlobal = !userId;
  const key = isGlobal ? "users" : ["users", "userId=" + userId].join(":");
  return {
    get: async () => {
      if (isGlobal) {
        let v = await redis.get("version:users");
        if (!v) {
          const legacy = await redis.get("version:users:userId=undefined");
          v = legacy || 1;
          await redis.set("version:users", v);
        }
        return v;
      }
      return version.get(key);
    },
    incr: async () => {
      await version.incr("users");
      await version.incr("users:userId=undefined");
    },
  };
};

const admin = () => ({ get: () => version.get("admin"), incr: () => version.incr("admin") });

const authors = () => ({ get: () => version.get("authors"), incr: () => version.incr("authors") });

const image = (identifier) => {
  const key = identifier ? `image:path=${identifier}` : "image";
  return { get: () => version.get(key), incr: () => version.incr(key) };
};

const genres = () => ({ get: () => version.get("genres"), incr: () => version.incr("genres") });

/**
 * Nâng version và xóa cache Redis cho Story
 */
const clearStoriesCache = async (storyIds = [], storyTitles = []) => {
  try {
    // 1. Tăng version global
    await stories().incr();
    await storyNodes().incr();

    // 2. Tăng version cho từng truyện
    const ids = Array.from(new Set((storyIds || []).filter(Boolean)));
    const titles = Array.from(new Set((storyTitles || []).filter(Boolean)));

    for (const id of ids) {
      await stories(id).incr();
      await storyNodes(id).incr();
    }
    for (const title of titles) {
      await stories(title).incr();
    }

    // 3. Quét và xóa các cache key liên quan
    if (typeof redis.scan === "function") {
      const patterns = ["FindAllStories*", "GetRecommendStories*", ...ids.map((id) => `*${id}*`), ...titles.map((t) => `*${t}*`)];

      for (const pattern of patterns) {
        let cursor = "0";
        do {
          const [nextCursor, keys] = await redis.scan(cursor, "MATCH", pattern, "COUNT", 100);
          cursor = nextCursor;
          if (keys && keys.length > 0) {
            const keysToDelete = keys.filter((k) => !k.startsWith("version:"));
            if (keysToDelete.length > 0) {
              await redis.del(...keysToDelete);
            }
          }
        } while (cursor !== "0");
      }
    }
  } catch (err) {
    console.warn("⚠️ [Redis] Lỗi khi clearStoriesCache:", err?.message || err);
  }
};

const redisUtils = { stories, storyNodes, comments, ratings, histories, favourites, users, admin, image, authors, genres, clearStoriesCache };

export default redisUtils;
