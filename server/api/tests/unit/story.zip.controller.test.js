import { describe, it, expect, vi, beforeEach } from "vitest";
import { ZIP_CLEANUP_AFTER_PROCESSING } from "../../src/constants/Story.js";

// Mock story queue
const mockStoryQueue = {
  addJob_BatchImportZip: vi.fn().mockResolvedValue({ id: "job-zip-123" }),
};

vi.mock("../../configs/redis.js", () => ({
  redis: {
    options: { host: "127.0.0.1", port: 6379 },
    get: vi.fn(),
    set: vi.fn(),
    setex: vi.fn(),
  },
  connectToRedis: vi.fn(),
}));

vi.mock("../../worker/queues/story.queue.js", () => ({
  default: mockStoryQueue,
}));

// Mock zipStorage
vi.mock("../../src/utils/zip/zipStorage.js", () => ({
  downloadZipFromUrl: vi.fn().mockResolvedValue({
    filePath: "/tmp/fake/uploads/downloaded.zip",
    filename: "downloaded.zip",
    size: 1048576,
    sessionId: "sess_download_abc",
  }),
}));

describe("Admin Story Zip Controller", () => {
  let controller;

  beforeEach(async () => {
    vi.clearAllMocks();
    controller = await import("../../src/controllers/admin/story.controller.js");
  });

  describe("uploadBatchZipStory", () => {
    it("should enqueue batchImportZip job with file information", async () => {
      const req = {
        user: { id: "user-uuid" },
        file: {
          path: "/tmp/fake/uploads/session_123.zip",
          originalname: "manga.zip",
          filename: "session_123.zip",
          size: 5242880,
          sessionId: "session_123",
        },
        body: {},
      };

      const res = {
        status: vi.fn().mockReturnThis(),
        json: vi.fn(),
      };
      const next = vi.fn();

      await controller.uploadBatchZipStory(req, res, next);

      expect(mockStoryQueue.addJob_BatchImportZip).toHaveBeenCalledWith(
        expect.objectContaining({
          zipFilePath: "/tmp/fake/uploads/session_123.zip",
          originalName: "manga.zip",
          userId: "user-uuid",
          sessionId: "session_123",
          cleanupAfterProcessing: ZIP_CLEANUP_AFTER_PROCESSING,
        }),
      );

      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          data: expect.objectContaining({
            sessionId: "session_123",
            fileName: "manga.zip",
            fileSize: 5242880,
          }),
        }),
      );
    });

    it("should throw error if file is not provided in uploadBatchZipStory", async () => {
      const req = { user: { id: "user-uuid" }, file: null };
      const res = { status: vi.fn().mockReturnThis(), json: vi.fn() };
      const next = vi.fn();

      await controller.uploadBatchZipStory(req, res, next);

      expect(next).toHaveBeenCalledWith(
        expect.objectContaining({
          status: 400,
          message: expect.stringContaining("Vui lòng đính kèm file zip"),
        }),
      );
    });
  });

  describe("downloadBatchZipStory", () => {
    it("should download zip stream and enqueue worker job", async () => {
      const req = {
        user: { id: "user-uuid" },
        body: {
          url: "https://example.com/stories.zip",
        },
      };

      const res = {
        status: vi.fn().mockReturnThis(),
        json: vi.fn(),
      };
      const next = vi.fn();

      await controller.downloadBatchZipStory(req, res, next);

      expect(mockStoryQueue.addJob_BatchImportZip).toHaveBeenCalledWith(
        expect.objectContaining({
          zipFilePath: "/tmp/fake/uploads/downloaded.zip",
          originalName: "stories.zip",
          userId: "user-uuid",
          cleanupAfterProcessing: ZIP_CLEANUP_AFTER_PROCESSING,
        }),
      );

      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          data: expect.objectContaining({
            url: "https://example.com/stories.zip",
            fileName: "downloaded.zip",
            fileSize: 1048576,
          }),
        }),
      );
    });

    it("should throw error if url is missing in downloadBatchZipStory", async () => {
      const req = { user: { id: "user-uuid" }, body: {} };
      const res = { status: vi.fn().mockReturnThis(), json: vi.fn() };
      const next = vi.fn();

      await controller.downloadBatchZipStory(req, res, next);

      expect(next).toHaveBeenCalledWith(
        expect.objectContaining({
          status: 400,
          message: expect.stringContaining("Vui lòng cung cấp trường 'url'"),
        }),
      );
    });
  });
});
