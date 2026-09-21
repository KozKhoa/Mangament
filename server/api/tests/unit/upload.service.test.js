import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import uploadService from "../../src/services/upload.service.js";
import imageQueue from "../../worker/queues/image.queue.js";

vi.mock("../../worker/queues/image.queue.js", () => {
  return {
    default: {
      addJob_addStoryImages: vi.fn(),
      addJob_AddNewImage: vi.fn(),
      addJob_addManyNewImages: vi.fn(),
    },
  };
});

describe("Upload Service", () => {
  const originalEnv = { ...process.env };

  beforeEach(() => {
    vi.clearAllMocks();
    process.env = { ...originalEnv };
  });

  afterEach(() => {
    process.env = { ...originalEnv };
  });

  describe("uploadStoryImages", () => {
    it("should return empty array if files is empty or not provided", async () => {
      const res1 = await uploadService.uploadStoryImages([]);
      expect(res1).toEqual({ success: true, data: [] });

      const res2 = await uploadService.uploadStoryImages(null);
      expect(res2).toEqual({ success: true, data: [] });

      expect(imageQueue.addJob_addStoryImages).not.toHaveBeenCalled();
    });

    it("should return image info with id and original_name preserving order and queue job to worker", async () => {
      const mockFiles = [
        {
          originalname: "chapter_page_001.png",
          mimetype: "image/png",
          buffer: Buffer.from("fake-image-1"),
          size: 100,
        },
        {
          originalname: "chapter_page_002.png",
          mimetype: "image/png",
          buffer: Buffer.from("fake-image-2"),
          size: 200,
        },
        {
          originalname: "chapter_page_003.jpg",
          mimetype: "image/jpeg",
          buffer: Buffer.from("fake-image-3"),
          size: 300,
        },
      ];

      const res = await uploadService.uploadStoryImages(mockFiles);

      expect(res.success).toBe(true);
      expect(res.data).toHaveLength(3);

      // Verify order and properties
      const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

      expect(res.data[0].original_name).toBe("chapter_page_001.png");
      expect(res.data[0].id).toMatch(uuidRegex);
      expect(res.data[0].path).toContain("/public/images/stories/");

      expect(res.data[1].original_name).toBe("chapter_page_002.png");
      expect(res.data[1].id).toMatch(uuidRegex);
      expect(res.data[1].path).toContain("/public/images/stories/");

      expect(res.data[2].original_name).toBe("chapter_page_003.jpg");
      expect(res.data[2].id).toMatch(uuidRegex);
      expect(res.data[2].path).toContain("/public/images/stories/");

      // Ensure IDs are unique
      const ids = res.data.map((item) => item.id);
      expect(new Set(ids).size).toBe(3);

      // Verify queue was called with job data matching the generated IDs and files
      expect(imageQueue.addJob_addStoryImages).toHaveBeenCalledTimes(1);
      const queueArg = imageQueue.addJob_addStoryImages.mock.calls[0][0];
      expect(queueArg.images).toHaveLength(3);
      expect(queueArg.images[0].id).toBe(res.data[0].id);
      expect(queueArg.images[0].file.originalname).toBe("chapter_page_001.png");
      expect(queueArg.images[1].id).toBe(res.data[1].id);
      expect(queueArg.images[1].file.originalname).toBe("chapter_page_002.png");
      expect(queueArg.images[2].id).toBe(res.data[2].id);
      expect(queueArg.images[2].file.originalname).toBe("chapter_page_003.jpg");
    });

    it("should switch to R2 when STORAGE_PROVIDER=r2", async () => {
      const prev = process.env.STORAGE_PROVIDER;
      const prevCdn = process.env.CDN_URL;
      process.env.STORAGE_PROVIDER = "r2";
      process.env.CDN_URL = "https://cdn.myr2.dev";

      const mockFiles = [
        {
          originalname: "chapter_r2.png",
          mimetype: "image/png",
          buffer: Buffer.from("fake-image"),
          size: 100,
        },
      ];

      const res = await uploadService.uploadStoryImages(mockFiles);

      expect(res.success).toBe(true);
      expect(res.data[0].provider).toBe("r2");
      expect(res.data[0].path).toMatch(/^stories\//);
      expect(res.data[0].url).toContain("https://cdn.myr2.dev/stories/");

      process.env.STORAGE_PROVIDER = prev;
      process.env.CDN_URL = prevCdn;
    });

    it("should reject when files count exceeds 50", async () => {
      const excessFiles = Array.from({ length: 51 }, (_, i) => ({
        originalname: `page_${i}.jpg`,
        mimetype: "image/jpeg",
        buffer: Buffer.from("data"),
        size: 100,
      }));

      await expect(uploadService.uploadStoryImages(excessFiles)).rejects.toThrow(/vượt quá giới hạn tối đa 50 ảnh/);
    });

    it("should reject when an individual file exceeds 20MB", async () => {
      const largeFiles = [
        {
          originalname: "huge_page.jpg",
          mimetype: "image/jpeg",
          buffer: Buffer.from("huge"),
          size: 25 * 1024 * 1024, // 25MB
        },
      ];

      await expect(uploadService.uploadStoryImages(largeFiles)).rejects.toThrow(/vượt quá giới hạn tối đa 20MB/);
    });
  });

  describe("uploadAvatar", () => {
    it("should upload avatar and queue addJob_AddNewImage", async () => {
      const mockFile = {
        originalname: "my_avatar.png",
        mimetype: "image/png",
        buffer: Buffer.from("avatar-data"),
        size: 50,
      };

      const res = await uploadService.uploadAvatar("user-123", mockFile);

      expect(res.success).toBe(true);
      expect(res.data.id).toBeDefined();
      expect(res.data.path).toContain("avatars");
      expect(res.data.original_name).toBe("my_avatar.png");
      expect(imageQueue.addJob_AddNewImage).toHaveBeenCalledTimes(1);
    });

    it("should reject avatar larger than 20MB", async () => {
      const hugeAvatar = {
        originalname: "huge_avatar.png",
        mimetype: "image/png",
        buffer: Buffer.from("huge"),
        size: 21 * 1024 * 1024,
      };

      await expect(uploadService.uploadAvatar("user-123", hugeAvatar)).rejects.toThrow(/vượt quá giới hạn tối đa 20MB/);
    });
  });
});
