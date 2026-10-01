import { describe, it, expect, vi, beforeEach } from "vitest";
import {
  InsertImage,
  UpdateImage,
  UpsertImage,
  FindImage,
  CalculateImageHash,
  FindExistingImageByHash,
  FindExistingImageByBuffer,
  ResolveOrCreateImage,
} from "../../src/services/image.service.js";
import db from "../../configs/db.js";

vi.mock("../../worker/queues/image.queue.js", () => ({
  default: {
    addJob_PermenantDeleteImage: vi.fn(),
    addJob_PermenantDeleteManyImages: vi.fn(),
  },
}));

vi.mock("../../src/utils/Redis.js", () => ({
  default: {
    image: vi.fn().mockReturnValue({
      get: vi.fn().mockResolvedValue("1"),
      incr: vi.fn(),
    }),
  },
}));

vi.mock("../../configs/db.js", () => {
  return {
    default: {
      image: {
        upsert: vi.fn(),
        create: vi.fn(),
        findFirst: vi.fn(),
        findUnique: vi.fn(),
        update: vi.fn(),
      },
    },
  };
});

describe("Image Service", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("CalculateImageHash", () => {
    it("should return correct SHA-256 hex hash for a buffer", () => {
      const buf = Buffer.from("hello world");
      const hash = CalculateImageHash(buf);
      expect(hash).toBe("b94d27b9934d3e08a52e52d7da7dabfac484efe37a5380ee9088f7ace2efcde9");
    });

    it("should return null for empty or missing buffer", () => {
      expect(CalculateImageHash(null)).toBeNull();
      expect(CalculateImageHash(undefined)).toBeNull();
    });
  });

  describe("FindExistingImageByHash", () => {
    it("should query db.image.findUnique with hash", async () => {
      const mockImage = { id: "img-1", hash: "abc-hash" };
      db.image.findUnique.mockResolvedValue(mockImage);

      const result = await FindExistingImageByHash("abc-hash");

      expect(db.image.findUnique).toHaveBeenCalledWith({ where: { hash: "abc-hash" } });
      expect(result).toEqual(mockImage);
    });

    it("should return null if hash is not provided", async () => {
      const result = await FindExistingImageByHash(null);
      expect(result).toBeNull();
      expect(db.image.findUnique).not.toHaveBeenCalled();
    });
  });

  describe("FindExistingImageByBuffer", () => {
    it("should calculate hash and query db by hash", async () => {
      const buf = Buffer.from("test-image-data");
      const expectedHash = CalculateImageHash(buf);
      const mockImage = { id: "img-2", hash: expectedHash };
      db.image.findUnique.mockResolvedValue(mockImage);

      const result = await FindExistingImageByBuffer(buf);

      expect(db.image.findUnique).toHaveBeenCalledWith({ where: { hash: expectedHash } });
      expect(result).toEqual(mockImage);
    });
  });

  describe("InsertImage", () => {
    it("should insert image without accepting id and include hash if provided", async () => {
      const mockImage = {
        id: "auto-generated-id",
        provider: "local",
        mine_type: "image/jpeg",
        size: 5000,
        path: "/public/images/stories/new.jpg",
        hash: "hash123",
      };

      db.image.findUnique.mockResolvedValue(null);
      db.image.create.mockResolvedValue(mockImage);

      const result = await InsertImage({
        path: "/public/images/stories/new.jpg",
        size: 5000,
        hash: "hash123",
      });

      expect(result.success).toBe(true);
      expect(result.data).toEqual(mockImage);
      const createData = db.image.create.mock.calls[0][0].data;
      expect(createData.id).toBeUndefined();
      expect(createData.path).toBe("/public/images/stories/new.jpg");
      expect(createData.hash).toBe("hash123");
    });

    it("should return existing image if hash already exists in DB", async () => {
      const existing = { id: "existing-hash-id", hash: "duplicate-hash", path: "/path.jpg" };
      db.image.findUnique.mockImplementation(async ({ where }) => {
        if (where.hash === "duplicate-hash") return existing;
        return null;
      });

      const result = await InsertImage({
        path: "/new-path.jpg",
        hash: "duplicate-hash",
      });

      expect(result.success).toBe(true);
      expect(result.data).toEqual(existing);
      expect(db.image.create).not.toHaveBeenCalled();
    });

    it("should throw error if image with path already exists", async () => {
      db.image.findUnique.mockResolvedValue({ id: "existing-id", path: "/public/images/stories/exists.jpg" });

      await expect(
        InsertImage({
          path: "/public/images/stories/exists.jpg",
        }),
      ).rejects.toThrow("Image already exists");
    });
  });

  describe("UpdateImage", () => {
    it("should throw error if id is not provided", async () => {
      await expect(
        UpdateImage({
          path: "/public/images/stories/new.jpg",
        }),
      ).rejects.toThrow("Require 'id'");
    });

    it("should throw error if image with id is not found", async () => {
      db.image.findUnique.mockResolvedValue(null);

      await expect(
        UpdateImage({
          id: "non-existent-id",
          size: 1000,
        }),
      ).rejects.toThrow("Image not found");
    });

    it("should update image including hash if provided", async () => {
      const existingImage = { id: "img-1", path: "/public/images/stories/old.jpg" };
      const updatedImage = { id: "img-1", path: "/public/images/stories/updated.jpg", size: 9999, hash: "new-hash" };

      db.image.findUnique.mockResolvedValue(existingImage);
      db.image.update.mockResolvedValue(updatedImage);

      const result = await UpdateImage({
        id: "img-1",
        path: "/public/images/stories/updated.jpg",
        size: 9999,
        hash: "new-hash",
      });

      expect(result.success).toBe(true);
      expect(result.data).toEqual(updatedImage);
      expect(db.image.update).toHaveBeenCalledWith({
        where: { id: "img-1" },
        data: expect.objectContaining({
          path: "/public/images/stories/updated.jpg",
          size: 9999,
          hash: "new-hash",
        }),
      });
    });
  });

  describe("UpsertImage", () => {
    it("should return existing image if hash already exists in DB", async () => {
      const existingByHash = { id: "img-hash-1", hash: "existing-hash-val" };
      db.image.findUnique.mockResolvedValue(existingByHash);

      const result = await UpsertImage({
        path: "/some-path.jpg",
        hash: "existing-hash-val",
      });

      expect(result.success).toBe(true);
      expect(result.data).toEqual(existingByHash);
      expect(db.image.create).not.toHaveBeenCalled();
      expect(db.image.update).not.toHaveBeenCalled();
    });

    it("should insert when id is not provided and hash is new", async () => {
      const mockCreated = { id: "new-id", path: "/public/images/stories/new.jpg", hash: "new-hash" };
      db.image.findUnique.mockResolvedValue(null);
      db.image.create.mockResolvedValue(mockCreated);

      const result = await UpsertImage({
        path: "/public/images/stories/new.jpg",
        hash: "new-hash",
      });

      expect(result.success).toBe(true);
      expect(db.image.create).toHaveBeenCalled();
    });

    it("should update when id exists in database", async () => {
      const existing = { id: "img-1", path: "/public/images/stories/exist.jpg" };
      const updated = { id: "img-1", path: "/public/images/stories/exist.jpg", size: 2000, hash: "updated-hash" };

      db.image.findUnique.mockImplementation(async ({ where }) => {
        if (where.id === "img-1") return existing;
        return null;
      });
      db.image.update.mockResolvedValue(updated);

      const result = await UpsertImage({
        id: "img-1",
        size: 2000,
        hash: "updated-hash",
      });

      expect(result.success).toBe(true);
      expect(db.image.update).toHaveBeenCalledWith({
        where: { id: "img-1" },
        data: expect.objectContaining({ size: 2000, hash: "updated-hash" }),
      });
    });

    it("should insert with provided id when id does not exist in database", async () => {
      const createdWithId = { id: "pre-generated-id", path: "/public/images/stories/story.jpg", hash: "unique-hash" };
      db.image.findUnique.mockResolvedValue(null);
      db.image.create.mockResolvedValue(createdWithId);

      const result = await UpsertImage({
        id: "pre-generated-id",
        path: "/public/images/stories/story.jpg",
        hash: "unique-hash",
      });

      expect(result.success).toBe(true);
      expect(db.image.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          id: "pre-generated-id",
          path: "/public/images/stories/story.jpg",
          hash: "unique-hash",
        }),
      });
    });
  });

  describe("ResolveOrCreateImage", () => {
    it("should return existing image id if found by hash", async () => {
      const existing = { id: "hash-match-id", hash: "hash-val" };
      db.image.findUnique.mockResolvedValue(existing);

      const result = await ResolveOrCreateImage({ hash: "hash-val" });

      expect(result).toBe("hash-match-id");
      expect(db.image.findUnique).toHaveBeenCalledWith({ where: { hash: "hash-val" } });
    });

    it("should create new image with hash if image not found", async () => {
      db.image.findUnique.mockResolvedValue(null);
      db.image.create.mockResolvedValue({ id: "new-img-id", hash: "new-hash" });

      const result = await ResolveOrCreateImage({ hash: "new-hash", path: "/path.jpg" });

      expect(result).toBe("new-img-id");
      expect(db.image.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          hash: "new-hash",
          path: "/path.jpg",
        }),
      });
    });
  });

  describe("FindImage", () => {
    it("should find image by path or id", async () => {
      const mockImage = {
        id: "img-123",
        path: "/public/images/stories/abc.jpg",
        deleted_status: "not_deleted",
        hash: "some-hash",
      };

      db.image.findFirst.mockResolvedValue(mockImage);

      const result = await FindImage({ path: "/public/images/stories/abc.jpg" });

      expect(result.success).toBe(true);
      expect(result.data).toEqual(mockImage);
    });
  });
});
