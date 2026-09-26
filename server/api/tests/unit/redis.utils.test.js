import { describe, it, expect, vi, beforeEach } from "vitest";

const redisStore = new Map();

vi.mock("../../configs/redis.js", () => ({
  redis: {
    get: vi.fn(async (key) => redisStore.get(key) || null),
    set: vi.fn(async (key, val) => {
      redisStore.set(key, String(val));
      return "OK";
    }),
    incr: vi.fn(async (key) => {
      const current = Number(redisStore.get(key) || 0) + 1;
      redisStore.set(key, String(current));
      return current;
    }),
    del: vi.fn(async (...keys) => {
      let count = 0;
      for (const k of keys) {
        if (redisStore.delete(k)) count++;
      }
      return count;
    }),
    scan: vi.fn(async (cursor, matchClause, pattern) => {
      const regex = new RegExp("^" + pattern.replace(/\*/g, ".*") + "$");
      const matched = [];
      for (const k of redisStore.keys()) {
        if (regex.test(k)) matched.push(k);
      }
      return ["0", matched];
    }),
  },
  connectToRedis: vi.fn(),
}));

describe("Redis Utils & Story Cache Versioning", () => {
  let redisUtils;

  beforeEach(async () => {
    vi.clearAllMocks();
    redisStore.clear();
    const mod = await import("../../src/utils/Redis.js");
    redisUtils = mod.default;
  });

  it("should initialize and increment global stories version on both version:stories and legacy key", async () => {
    const ver1 = await redisUtils.stories().get();
    expect(Number(ver1)).toBe(1);

    await redisUtils.stories().incr();

    const ver2 = await redisUtils.stories().get();
    expect(Number(ver2)).toBe(2);
    expect(redisStore.get("version:stories")).toBe("2");
    expect(redisStore.get("version:stories:storyId=undefined")).toBe("2");
  });

  it("should increment specific storyId and storyTitle version keys", async () => {
    await redisUtils.stories("story-uuid-1").incr();
    await redisUtils.stories("Naruto").incr();

    const storyVer = await redisUtils.stories("story-uuid-1").get();
    const titleVer = await redisUtils.stories("Naruto").get();

    expect(Number(storyVer)).toBe(1);
    expect(Number(titleVer)).toBe(1);
    expect(redisStore.get("version:stories:storyId=story-uuid-1")).toBe("1");
    expect(redisStore.get("version:stories:storyId=Naruto")).toBe("1");
  });

  it("should increment storyNodes global and specific versions", async () => {
    await redisUtils.storyNodes().incr();
    await redisUtils.storyNodes("node-uuid-1").incr();

    expect(redisStore.get("version:storyNodes")).toBe("1");
    expect(redisStore.get("version:storyNodes:storyNodeId=node-uuid-1")).toBe("1");
  });

  it("should clear stories cache, increment versions, and remove matched keys in clearStoriesCache", async () => {
    // Populate some fake cache entries
    redisStore.set("FindAllStories:ver=1:page=1", "cached_json");
    redisStore.set("FindStory:storiesVer=1:id=story-uuid-10", "cached_story");
    redisStore.set("GetRecommendStories:ver=1", "cached_recommend");

    await redisUtils.clearStoriesCache(["story-uuid-10"], ["One Piece"]);

    // Versions should be incremented
    expect(Number(redisStore.get("version:stories"))).toBeGreaterThanOrEqual(1);
    expect(Number(redisStore.get("version:storyNodes"))).toBeGreaterThanOrEqual(1);
    expect(Number(redisStore.get("version:stories:storyId=story-uuid-10"))).toBe(1);
    expect(Number(redisStore.get("version:stories:storyId=One Piece"))).toBe(1);

    // Matching keys should be deleted
    expect(redisStore.has("FindAllStories:ver=1:page=1")).toBe(false);
    expect(redisStore.has("FindStory:storiesVer=1:id=story-uuid-10")).toBe(false);
    expect(redisStore.has("GetRecommendStories:ver=1")).toBe(false);
  });
});
