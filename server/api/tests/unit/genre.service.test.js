import { describe, it, expect, vi } from "vitest";
import { ValidateGenre, GetAllGenre, FindAllStoryGenres, AddManyStoryGenres, HardDeleteStoryGenre } from "../../src/services/genre.service.js";
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

  describe("ValidateGenre", () => {
    it("should return valid genres from a list", () => {
      const input = ["ACTION", "INVALID", "COMEDY"];
      const result = ValidateGenre(input);
      expect(result).toEqual(["ACTION", "COMEDY"]);
    });

    it("should handle single string input", () => {
      const input = "ACTION";
      const result = ValidateGenre(input);
      expect(result).toEqual(["ACTION"]);
    });

    it("should return unique genres", () => {
      const input = ["ACTION", "ACTION", "COMEDY"];
      const result = ValidateGenre(input);
      expect(result).toEqual(["ACTION", "COMEDY"]);
    });

    it("should return empty array if no valid genres", () => {
      const input = ["INVALID", "NOT_A_GENRE"];
      const result = ValidateGenre(input);
      expect(result).toEqual([]);
    });

    it("should handle empty input", () => {
      const result = ValidateGenre([]);
      expect(result).toEqual([]);
    });
  });

  describe("FindAllStoryGenres", () => {
    it("should return success and data on successful query", async () => {
      const mockData = [{ story_id: 1, genre: "ACTION" }];
      db.story_Genre.findMany.mockResolvedValue(mockData);

      const result = await FindAllStoryGenres({ story_id: 1 });
      
      expect(result.success).toBe(true);
      expect(result.data).toEqual(mockData);
      expect(db.story_Genre.findMany).toHaveBeenCalledWith({
        where: { story_id: 1 },
        select: { story_id: true, genre: true },
      });
    });

    it("should return success false on error", async () => {
      db.story_Genre.findMany.mockRejectedValue({ code: "P2002" });

      const result = await FindAllStoryGenres({ story_id: 1 });
      
      expect(result.success).toBe(false);
      expect(result.error).toBe("P2002");
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
