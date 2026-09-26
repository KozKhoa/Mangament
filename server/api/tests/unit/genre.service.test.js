import { describe, it, expect, vi, beforeEach } from "vitest";
import { GetAllGenres, AddManyStoryGenres } from "../../src/services/genre.service.js";
import db from "../../configs/db.js";

// Mock the db and redis configs
vi.mock("../../configs/db.js", () => {
  return {
    default: {
      genre: {
        findMany: vi.fn(),
        createMany: vi.fn(),
      },
      story_Genre: {
        findMany: vi.fn(),
        createMany: vi.fn(),
      },
      $queryRaw: vi.fn(),
    },
  };
});

vi.mock("../../configs/redis.js", () => {
  return {
    redis: {
      get: vi.fn().mockResolvedValue(null),
      setex: vi.fn().mockResolvedValue("OK"),
    },
  };
});

vi.mock("../../src/utils/Redis.js", () => {
  return {
    default: {
      genres: () => ({
        get: vi.fn().mockResolvedValue("1"),
      }),
    },
  };
});

describe("Genre Service", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("GetAllGenres", () => {
    it("should return genres from db when cache is empty", async () => {
      const mockGenres = [
        { id: "1", name: "Action", description: "Action genre", thumbnail: null },
        { id: "2", name: "Comedy", description: "Comedy genre", thumbnail: null },
      ];
      db.genre.findMany.mockResolvedValue(mockGenres);

      const result = await GetAllGenres();
      expect(result.success).toBe(true);
      expect(result.data).toEqual(mockGenres);
      expect(db.genre.findMany).toHaveBeenCalled();
    });
  });

  describe("AddManyStoryGenres", () => {
    it("should return success on successful creation", async () => {
      const mockData = { count: 2 };
      db.story_Genre.createMany.mockResolvedValue(mockData);

      const result = await AddManyStoryGenres([{ story_id: 1, genre_id: "1" }]);

      expect(result.success).toBe(true);
      expect(result.data).toEqual(mockData);
    });

    it("should return failure on database error", async () => {
      db.story_Genre.createMany.mockRejectedValue({ code: "P2002" });

      const result = await AddManyStoryGenres([{ story_id: 1, genre_id: "1" }]);

      expect(result.success).toBe(false);
      expect(result.error).toBe("P2002");
    });
  });
});
