import { describe, it, expect, vi, beforeEach } from "vitest";
import { InsertImage, UpdateImage, UpsertImage, FindImage } from "../../src/services/image.service.js";
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

  describe("InsertImage", () => {
    it("should insert image without accepting id", async () => {
      const mockImage = {
        id: "auto-generated-id",
        provider: "local",
        mine_type: "image/jpeg",
        size: 5000,
        path: "/public/images/stories/new.jpg",
      };

      db.image.findUnique.mockResolvedValue(null);
      db.image.create.mockResolvedValue(mockImage);

      const result = await InsertImage({
        path: "/public/images/stories/new.jpg",
        size: 5000,
      });

      expect(result.success).toBe(true);
      expect(result.data).toEqual(mockImage);
      // Ensure id is not passed to db.image.create
      const createData = db.image.create.mock.calls[0][0].data;
      expect(createData.id).toBeUndefined();
      expect(createData.path).toBe("/public/images/stories/new.jpg");
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

    it("should update image if id is found", async () => {
      const existingImage = { id: "img-1", path: "/public/images/stories/old.jpg" };
      const updatedImage = { id: "img-1", path: "/public/images/stories/updated.jpg", size: 9999 };

      db.image.findUnique.mockResolvedValue(existingImage);
      db.image.update.mockResolvedValue(updatedImage);

      const result = await UpdateImage({
        id: "img-1",
        path: "/public/images/stories/updated.jpg",
        size: 9999,
      });

      expect(result.success).toBe(true);
      expect(result.data).toEqual(updatedImage);
      expect(db.image.update).toHaveBeenCalledWith({
        where: { id: "img-1" },
        data: expect.objectContaining({
          path: "/public/images/stories/updated.jpg",
          size: 9999,
        }),
      });
    });
  });

  describe("UpsertImage", () => {
    it("should insert when id is not provided", async () => {
      const mockCreated = { id: "new-id", path: "/public/images/stories/new.jpg" };
      db.image.findUnique.mockResolvedValue(null);
      db.image.create.mockResolvedValue(mockCreated);

      const result = await UpsertImage({
        path: "/public/images/stories/new.jpg",
      });

      expect(result.success).toBe(true);
      expect(db.image.create).toHaveBeenCalled();
    });

    it("should update when id exists in database", async () => {
      const existing = { id: "img-1", path: "/public/images/stories/exist.jpg" };
      const updated = { id: "img-1", path: "/public/images/stories/exist.jpg", size: 2000 };

      db.image.findUnique.mockResolvedValue(existing);
      db.image.update.mockResolvedValue(updated);

      const result = await UpsertImage({
        id: "img-1",
        size: 2000,
      });

      expect(result.success).toBe(true);
      expect(db.image.update).toHaveBeenCalledWith({
        where: { id: "img-1" },
        data: expect.objectContaining({ size: 2000 }),
      });
    });

    it("should insert with provided id when id does not exist in database", async () => {
      const createdWithId = { id: "pre-generated-id", path: "/public/images/stories/story.jpg" };
      db.image.findUnique.mockResolvedValue(null);
      db.image.create.mockResolvedValue(createdWithId);

      const result = await UpsertImage({
        id: "pre-generated-id",
        path: "/public/images/stories/story.jpg",
      });

      expect(result.success).toBe(true);
      expect(db.image.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          id: "pre-generated-id",
          path: "/public/images/stories/story.jpg",
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
      };

      db.image.findFirst.mockResolvedValue(mockImage);

      const result = await FindImage({ path: "/public/images/stories/abc.jpg" });

      expect(result.success).toBe(true);
      expect(result.data).toEqual(mockImage);
    });
  });
});
