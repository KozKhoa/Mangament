import { describe, it, expect, vi, beforeEach } from "vitest";

const mockStoryQueue = {
  addJob_BatchImportZip: vi.fn().mockResolvedValue({ id: "job-zip-1" }),
  addJob_BatchImportStories: vi.fn().mockResolvedValue({ id: "job-stories-1" }),
};

const mockDownloadZipFromUrl = vi.fn().mockResolvedValue({
  filePath: "/tmp/fake/uploads/downloaded.zip",
  filename: "remote_story.zip",
  size: 2048,
  sessionId: "sess_mock_1",
});

const mockParseStoriesSpreadsheet = vi.fn().mockReturnValue([
  { title: "Story 1", storyNodes: [] },
  { title: "Story 2", storyNodes: [] },
]);

vi.mock("../../configs/db.js", () => ({
  default: {},
}));

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

vi.mock("../../src/utils/zip/zipStorage.js", () => ({
  downloadZipFromUrl: mockDownloadZipFromUrl,
}));

vi.mock("../../src/utils/spreadsheet.parser.js", () => ({
  parseStoriesSpreadsheet: mockParseStoriesSpreadsheet,
}));

describe("Story Service - Batch & Zip Processing", () => {
  let storyService;

  beforeEach(async () => {
    vi.clearAllMocks();
    storyService = await import("../../src/services/story.service.js");
  });

  describe("ProcessUploadBatchZip", () => {
    it("should throw 400 error when file is not provided", async () => {
      await expect(storyService.ProcessUploadBatchZip({ file: null })).rejects.toThrowError(/Vui lòng đính kèm file zip thông qua trường 'file'/);
    });

    it("should enqueue batch import zip job and return metadata", async () => {
      const file = {
        path: "/tmp/fake/uploads/my_manga.zip",
        originalname: "my_manga.zip",
        size: 5000000,
        sessionId: "sess_custom_123",
      };

      const result = await storyService.ProcessUploadBatchZip({
        file,
        userId: "user-uuid-1",
        cleanupAfterProcessing: false,
      });

      expect(mockStoryQueue.addJob_BatchImportZip).toHaveBeenCalledWith({
        zipFilePath: file.path,
        originalName: "my_manga.zip",
        userId: "user-uuid-1",
        sessionId: "sess_custom_123",
        cleanupAfterProcessing: false,
      });

      expect(result).toEqual({
        sessionId: "sess_custom_123",
        fileName: "my_manga.zip",
        fileSize: 5000000,
        zipPath: file.path,
      });
    });
  });

  describe("ProcessDownloadBatchZip", () => {
    it("should throw 400 error when url is not provided", async () => {
      await expect(storyService.ProcessDownloadBatchZip({ url: "" })).rejects.toThrowError(/Vui lòng cung cấp trường 'url' chứa đường dẫn tải file zip/);
    });

    it("should download zip from URL, enqueue job, and return metadata", async () => {
      const result = await storyService.ProcessDownloadBatchZip({
        url: "https://example.com/archive.zip",
        userId: "user-uuid-2",
        cleanupAfterProcessing: true,
      });

      expect(mockDownloadZipFromUrl).toHaveBeenCalledWith("https://example.com/archive.zip", expect.objectContaining({ sessionId: expect.any(String) }));

      expect(mockStoryQueue.addJob_BatchImportZip).toHaveBeenCalledWith(
        expect.objectContaining({
          zipFilePath: "/tmp/fake/uploads/downloaded.zip",
          originalName: "archive.zip",
          userId: "user-uuid-2",
          cleanupAfterProcessing: true,
        }),
      );

      expect(result).toEqual({
        sessionId: expect.any(String),
        url: "https://example.com/archive.zip",
        fileName: "remote_story.zip",
        fileSize: 2048,
        zipPath: "/tmp/fake/uploads/downloaded.zip",
      });
    });
  });

  describe("ProcessBatchImportSpreadsheet", () => {
    it("should throw 400 error when buffer is not provided", async () => {
      await expect(storyService.ProcessBatchImportSpreadsheet({ buffer: null, fileName: "test.csv" })).rejects.toThrowError(
        /Vui lòng đính kèm file bảng tính hợp lệ/,
      );
    });

    it("should throw 400 error when spreadsheet contains no valid rows", async () => {
      mockParseStoriesSpreadsheet.mockReturnValueOnce([]);
      await expect(storyService.ProcessBatchImportSpreadsheet({ buffer: Buffer.from("header"), fileName: "empty.csv" })).rejects.toThrowError(
        /File bảng tính không có dòng dữ liệu truyện hợp lệ nào/,
      );
    });

    it("should parse spreadsheet, enqueue batch import stories job, and return row count", async () => {
      const result = await storyService.ProcessBatchImportSpreadsheet({
        buffer: Buffer.from("mock spreadsheet data"),
        fileName: "stories.xlsx",
        userId: "user-uuid-3",
      });

      expect(mockParseStoriesSpreadsheet).toHaveBeenCalled();
      expect(mockStoryQueue.addJob_BatchImportStories).toHaveBeenCalledWith({
        rows: [
          { title: "Story 1", storyNodes: [] },
          { title: "Story 2", storyNodes: [] },
        ],
        userId: "user-uuid-3",
        fileName: "stories.xlsx",
      });

      expect(result).toEqual({
        totalRows: 2,
        fileName: "stories.xlsx",
      });
    });
  });
});
