import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import fs from "fs";
import path from "path";
import os from "os";
import { isUUID, resolveNation, resolvePoster, resolveGenres, resolveAuthors, inspectStory, readStoryInfoJson } from "../../scripts/upload-stories/index.js";

describe("Upload Stories Script - Unit Tests", () => {
  describe("isUUID helper", () => {
    it("should recognize valid UUIDs", () => {
      expect(isUUID("123e4567-e89b-12d3-a456-426614174000")).toBe(true);
      expect(isUUID("c56a4180-65aa-42ec-a945-5fd21dec0538")).toBe(true);
    });

    it("should reject invalid UUIDs", () => {
      expect(isUUID("not-a-uuid")).toBe(false);
      expect(isUUID("123")).toBe(false);
      expect(isUUID("")).toBe(false);
      expect(isUUID(null)).toBe(false);
    });
  });

  describe("resolveNation", () => {
    it("should resolve nation by valid UUID if exists", async () => {
      const mockPrisma = {
        nation: {
          findUnique: vi.fn().mockResolvedValue({ id: "123e4567-e89b-12d3-a456-426614174000", name: "Japan" }),
          findFirst: vi.fn(),
          create: vi.fn(),
        },
      };

      const result = await resolveNation(mockPrisma, "123e4567-e89b-12d3-a456-426614174000", "Japan");
      expect(result).toBe("123e4567-e89b-12d3-a456-426614174000");
      expect(mockPrisma.nation.findUnique).toHaveBeenCalled();
    });

    it("should resolve nation by name if UUID is not found or not provided", async () => {
      const mockPrisma = {
        nation: {
          findUnique: vi.fn().mockResolvedValue(null),
          findFirst: vi.fn().mockResolvedValue({ id: "nation-uuid-2", name: "Korea" }),
          create: vi.fn(),
        },
      };

      const result = await resolveNation(mockPrisma, null, "Korea");
      expect(result).toBe("nation-uuid-2");
      expect(mockPrisma.nation.findFirst).toHaveBeenCalled();
    });

    it("should create nation if not found by name", async () => {
      const mockPrisma = {
        nation: {
          findUnique: vi.fn().mockResolvedValue(null),
          findFirst: vi.fn().mockResolvedValue(null),
          create: vi.fn().mockResolvedValue({ id: "nation-uuid-new", name: "Vietnam" }),
        },
      };

      const result = await resolveNation(mockPrisma, null, "Vietnam");
      expect(result).toBe("nation-uuid-new");
      expect(mockPrisma.nation.create).toHaveBeenCalledWith({ data: { name: "Vietnam" } });
    });
  });

  describe("resolvePoster", () => {
    it("should return poster id if valid UUID and user exists", async () => {
      const userId = "123e4567-e89b-12d3-a456-426614174000";
      const mockPrisma = {
        user: {
          findUnique: vi.fn().mockResolvedValue({ id: userId }),
        },
      };

      const result = await resolvePoster(mockPrisma, userId);
      expect(result).toBe(userId);
    });

    it("should return null if user does not exist or invalid UUID", async () => {
      const mockPrisma = {
        user: {
          findUnique: vi.fn().mockResolvedValue(null),
        },
      };

      expect(await resolvePoster(mockPrisma, "not-a-uuid")).toBeNull();
      expect(await resolvePoster(mockPrisma, "123e4567-e89b-12d3-a456-426614174000")).toBeNull();
    });
  });

  describe("resolveGenres", () => {
    it("should find existing genres and create new ones", async () => {
      const mockPrisma = {
        genre: {
          findFirst: vi.fn().mockImplementation(({ where }) => {
            if (where.name.equals.toLowerCase() === "action") {
              return Promise.resolve({ id: "genre-action-id", name: "Action" });
            }
            return Promise.resolve(null);
          }),
          create: vi.fn().mockImplementation(({ data }) => {
            return Promise.resolve({ id: `genre-${data.name}-id`, name: data.name });
          }),
        },
      };

      const genreIds = await resolveGenres(mockPrisma, ["Action", "Fantasy"]);
      expect(genreIds).toEqual(["genre-action-id", "genre-Fantasy-id"]);
      expect(mockPrisma.genre.findFirst).toHaveBeenCalledTimes(2);
      expect(mockPrisma.genre.create).toHaveBeenCalledTimes(1);
    });
  });

  describe("resolveAuthors", () => {
    it("should resolve author UUIDs and names", async () => {
      const existingUuid = "123e4567-e89b-12d3-a456-426614174000";
      const mockPrisma = {
        author: {
          findUnique: vi.fn().mockResolvedValue({ id: existingUuid, name: "Author 1" }),
          findFirst: vi.fn().mockResolvedValue({ id: "author-name-id", name: "Author Name" }),
          create: vi.fn(),
        },
      };

      const authorIds = await resolveAuthors(mockPrisma, [existingUuid, "Author Name"]);
      expect(authorIds).toEqual([existingUuid, "author-name-id"]);
      expect(mockPrisma.author.findUnique).toHaveBeenCalled();
      expect(mockPrisma.author.findFirst).toHaveBeenCalled();
    });
  });

  describe("inspectStory with info.json", () => {
    let tempRoot;

    beforeEach(async () => {
      tempRoot = await fs.promises.mkdtemp(path.join(os.tmpdir(), "upload-inspect-test-"));
    });

    afterEach(async () => {
      if (tempRoot && fs.existsSync(tempRoot)) {
        await fs.promises.rm(tempRoot, { recursive: true, force: true });
      }
    });

    it("should read info.json, cover art, and chapters correctly", async () => {
      const storyDir = path.join(tempRoot, "My Story");
      const chap1Dir = path.join(storyDir, "chapter 01");
      await fs.promises.mkdir(chap1Dir, { recursive: true });

      const infoContent = {
        title: "My Custom Story Title",
        description: "A great adventure story.",
        genres: ["Action", "Adventure"],
        author: ["123e4567-e89b-12d3-a456-426614174000"],
        other_titles: ["Alias 1"],
        nation: "Japan",
        cover_art: "custom_cover.jpg",
      };

      await fs.promises.writeFile(path.join(storyDir, "info.json"), JSON.stringify(infoContent));
      await fs.promises.writeFile(path.join(storyDir, "custom_cover.jpg"), "custom cover data");
      await fs.promises.writeFile(path.join(chap1Dir, "001.jpg"), "page 1");

      const result = await inspectStory(storyDir);
      expect(result.info).not.toBeNull();
      expect(result.info.title).toBe("My Custom Story Title");
      expect(result.info.summary).toBe("A great adventure story.");
      expect(result.info.genres).toEqual(["Action", "Adventure"]);
      expect(result.info.authors).toEqual(["123e4567-e89b-12d3-a456-426614174000"]);
      expect(result.coverArtFile).toBe(path.join(storyDir, "custom_cover.jpg"));
      expect(result.nodes.length).toBe(1);
      expect(result.nodes[0].imageFiles).toEqual(["001.jpg"]);
    });

    it("should export readStoryInfoJson function", () => {
      expect(typeof readStoryInfoJson).toBe("function");
    });
  });
});
