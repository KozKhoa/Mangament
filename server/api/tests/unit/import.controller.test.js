import { describe, it, expect, vi, beforeEach } from "vitest";

const mockStoryQueue = {
  addJob_BatchImportZip: vi.fn().mockResolvedValue({ id: "job-zip-123" }),
  addJob_BatchImportStories: vi.fn().mockResolvedValue({ id: "job-stories-123" }),
};

vi.mock("../../configs/redis.js", () => ({
  redis: {
    options: { host: "127.0.0.1", port: 6379 },
    get: vi.fn(),
    set: vi.fn(),
    setex: vi.fn(),
    del: vi.fn().mockResolvedValue(1),
  },
  connectToRedis: vi.fn(),
}));

const mockDb = {
  storyImportSession: {
    create: vi.fn().mockImplementation(async ({ data }) => ({ id: "mock-session-id", ...data })),
    findUnique: vi.fn().mockResolvedValue({ id: "mock-session-id", session_id: "sess_123" }),
    findFirst: vi.fn().mockResolvedValue({ id: "mock-session-id", session_id: "sess_123", items: [] }),
    findMany: vi.fn().mockResolvedValue([{ id: "mock-session-id", session_id: "sess_123" }]),
    count: vi.fn().mockResolvedValue(1),
    update: vi.fn().mockImplementation(async ({ data }) => ({ id: "mock-session-id", ...data })),
  },
};

vi.mock("../../configs/db.js", () => ({
  default: mockDb,
}));

vi.mock("../../worker/queues/mail.queue.js", () => ({
  default: {
    addJob_SendOtp: vi.fn(),
    addJob_SendNewPassword: vi.fn(),
    addJob_SendUpdateStoryStatus: vi.fn(),
    addJob_SendNotificationWhenStoryUpdated: vi.fn(),
  },
}));

vi.mock("../../worker/queues/story.queue.js", () => ({
  default: mockStoryQueue,
}));

vi.mock("../../src/utils/zip/zipStorage.js", () => ({
  getTempDir: vi.fn(() => ({
    uploadsDir: "/tmp/fake/uploads",
    processingDir: "/tmp/fake/processing",
    completedDir: "/tmp/fake/completed",
    chunksDir: "/tmp/fake/uploads/chunks",
    stagingDir: "/tmp/fake/uploads/staging",
  })),
  getChunksDir: vi.fn((sessId) => `/tmp/fake/uploads/chunks/${sessId}`),
  checkFreeDiskSpace: vi.fn().mockResolvedValue({ hasSpace: true }),
  safeUnlink: vi.fn().mockResolvedValue(),
  downloadZipFromUrl: vi.fn().mockResolvedValue({
    filePath: "/tmp/fake/uploads/downloaded.zip",
    filename: "downloaded.zip",
    size: 1048576,
    sessionId: "sess_download_abc",
  }),
}));

vi.mock("../../src/utils/spreadsheet.parser.js", () => ({
  generateStoryImportTemplate: vi.fn(() => ({
    buffer: Buffer.from("mock excel"),
    mimeType: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    fileName: "stories_import_template.xlsx",
  })),
  parseStoriesSpreadsheet: vi.fn(() => [{ story: { title: "Test Story" } }]),
}));

describe("Admin Import Controller (/admin/import)", () => {
  let controller;

  beforeEach(async () => {
    vi.clearAllMocks();
    controller = await import("../../src/controllers/admin/import.controller.js");
  });

  describe("getStoryImportTemplate", () => {
    it("should return spreadsheet template binary attachment", async () => {
      const req = { query: { format: "xlsx", type: "full" } };
      const res = {
        setHeader: vi.fn(),
        send: vi.fn(),
      };
      const next = vi.fn();

      await controller.getStoryImportTemplate(req, res, next);

      expect(res.setHeader).toHaveBeenCalledWith("Content-Type", expect.stringContaining("spreadsheet"));
      expect(res.send).toHaveBeenCalled();
    });
  });

  describe("uploadBatchZipStory", () => {
    it("should enqueue batchImportZip job with file information", async () => {
      const req = {
        user: { id: "user-uuid" },
        file: {
          path: "/tmp/fake/uploads/custom.zip",
          originalname: "my_manga.zip",
          size: 5000000,
          sessionId: "sess_upload_123",
        },
      };
      const res = { status: vi.fn().mockReturnThis(), json: vi.fn() };
      const next = vi.fn();

      await controller.uploadBatchZipStory(req, res, next);

      expect(res.status).toHaveBeenCalledWith(200);
      expect(mockStoryQueue.addJob_BatchImportZip).toHaveBeenCalledWith(
        expect.objectContaining({
          zipFilePath: "/tmp/fake/uploads/custom.zip",
          originalName: "my_manga.zip",
          userId: "user-uuid",
        }),
      );
    });
  });

  describe("importStoriesSpreadsheet", () => {
    it("should throw error if file is missing", async () => {
      const req = { user: { id: "user-uuid" }, file: null };
      const res = { status: vi.fn().mockReturnThis(), json: vi.fn() };
      const next = vi.fn();

      await controller.importStoriesSpreadsheet(req, res, next);

      expect(next).toHaveBeenCalledWith(expect.any(Error));
    });

    it("should import spreadsheet and enqueue job", async () => {
      const req = {
        user: { id: "user-uuid" },
        file: {
          buffer: Buffer.from("mock data"),
          originalname: "stories.csv",
        },
      };
      const res = { status: vi.fn().mockReturnThis(), json: vi.fn() };
      const next = vi.fn();

      await controller.importStoriesSpreadsheet(req, res, next);

      expect(res.status).toHaveBeenCalledWith(200);
      expect(mockStoryQueue.addJob_BatchImportStories).toHaveBeenCalled();
    });
  });

  describe("getImportSessions & getImportSessionDetail", () => {
    it("should return paginated list of sessions", async () => {
      const req = { query: { page: 1, limit: 10 } };
      const res = { status: vi.fn().mockReturnThis(), json: vi.fn() };
      const next = vi.fn();

      await controller.getImportSessions(req, res, next);

      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          data: expect.any(Array),
          pagination: expect.any(Object),
        }),
      );
    });

    it("should return single session detail", async () => {
      const req = { params: { sessionId: "sess_123" } };
      const res = { status: vi.fn().mockReturnThis(), json: vi.fn() };
      const next = vi.fn();

      await controller.getImportSessionDetail(req, res, next);

      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          data: expect.objectContaining({
            session_id: "sess_123",
          }),
        }),
      );
    });
  });

  describe("cancelImportSession", () => {
    it("should cancel session and return 200", async () => {
      const req = { params: { sessionId: "sess_cancel_123" }, user: { id: "user-1" } };
      const res = { status: vi.fn().mockReturnThis(), json: vi.fn() };
      const next = vi.fn();

      await controller.cancelImportSession(req, res, next);

      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          message: expect.stringContaining("Đã hủy phiên"),
        }),
      );
    });
  });
});
