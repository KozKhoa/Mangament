import { describe, it, expect, vi } from "vitest";
import { GetAllGenre, AddManyStoryGenres, HardDeleteStoryGenre } from "../../src/services/genre.service.js";
import db from "../../configs/db.js";

// Mock the db config
vi.mock("../../configs/db.js", () => {
  return {
    Genre: {
      ACTION: "ACTION",
      ADVENTURE: "ADVENTURE",
      COMEDY: "COMEDY",
    },
    default: {
      story_Genre: {
        findMany: vi.fn(),
        createMany: vi.fn(),
        deleteMany: vi.fn(),
      },
    },
  };
});

describe("Genre Service", () => {
  describe("GetAllGenre", () => {
    it("should return all genre values", () => {
      const genres = GetAllGenre();
      expect(genres).toContain("ACTION");
      expect(genres).toContain("ADVENTURE");
      expect(genres).toContain("COMEDY");
    });
  });

  describe("AddManyStoryGenres", () => {
    it("should return success on successful creation", async () => {
      const mockData = { count: 2 };
      db.story_Genre.createMany.mockResolvedValue(mockData);

      const result = await AddManyStoryGenres([{ story_id: 1, genre: "ACTION" }]);

      expect(result.success).toBe(true);
      expect(result.data).toEqual(mockData);
    });
  });

  describe("HardDeleteStoryGenre", () => {
    it("should return success on successful deletion", async () => {
      db.story_Genre.deleteMany.mockResolvedValue({ count: 1 });

      const result = await HardDeleteStoryGenre({ story_id: 1 });

      expect(result.success).toBe(true);
    });
  });
});
