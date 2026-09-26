import { describe, it, expect, vi, beforeEach } from "vitest";

// Mock story queue
const mockStoryQueue = {
  addJob_BatchImportZip: vi.fn().mockResolvedValue({ id: "job-chunk-123" }),
};

// In-memory mock Redis store
let redisStore = new Map();
let redisSets = new Map();

const mockRedis = {
  options: { host: "127.0.0.1", port: 6379 },
  get: vi.fn(async (key) => redisStore.get(key) || null),
  set: vi.fn(async (key, val) => redisStore.set(key, val)),
  setex: vi.fn(async (key, ttl, val) => redisStore.set(key, val)),
  del: vi.fn(async (key) => {
    redisStore.delete(key);
    redisSets.delete(key);
  }),
  expire: vi.fn(async () => 1),
  sadd: vi.fn(async (key, member) => {
    if (!redisSets.has(key)) redisSets.set(key, new Set());
    redisSets.get(key).add(member);
    return 1;
  }),
  smembers: vi.fn(async (key) => {
    const set = redisSets.get(key);
    return set ? Array.from(set) : [];
  }),
  scard: vi.fn(async (key) => {
    const set = redisSets.get(key);
    return set ? set.size : 0;
  }),
};

vi.mock("../../configs/redis.js", () => ({
  redis: mockRedis,
  connectToRedis: vi.fn(),
}));

vi.mock("../../worker/queues/story.queue.js", () => ({
  default: mockStoryQueue,
}));

// Mock zipStorage
const mockZipStorage = {
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
  mergeChunksSequentially: vi.fn().mockResolvedValue({
    filePath: "/tmp/fake/uploads/session_chunk_1.zip",
    size: 20971520,
  }),
};

vi.mock("../../src/utils/zip/zipStorage.js", () => mockZipStorage);

// Mock fs
vi.mock("fs", async () => {
  const actual = await vi.importActual("fs");
  return {
    ...actual,
    default: {
      ...actual,
      existsSync: vi.fn(() => true),
      mkdirSync: vi.fn(),
      promises: {
        ...actual.promises,
        mkdir: vi.fn().mockResolvedValue(),
        rename: vi.fn().mockResolvedValue(),
        copyFile: vi.fn().mockResolvedValue(),
        unlink: vi.fn().mockResolvedValue(),
        stat: vi.fn().mockResolvedValue({ size: 1048576, isFile: () => true }),
      },
    },
  };
});

describe("Chunk Upload Service & Controller", () => {
  let chunkUploadService;
  let storyController;

  beforeEach(async () => {
    vi.clearAllMocks();
    redisStore.clear();
    redisSets.clear();

    chunkUploadService = await import("../../src/services/chunk-upload.service.js");
    storyController = await import("../../src/controllers/admin/story.controller.js");
  });

  describe("chunkUploadService.initChunkSession", () => {
    it("should reject non-zip files", async () => {
      await expect(
        chunkUploadService.initChunkSession({
          fileName: "stories.rar",
          fileSize: 1000,
          totalChunks: 1,
        }),
      ).rejects.toThrow("Chỉ hỗ trợ file nén định dạng .zip");
    });

    it("should reject if disk space is insufficient", async () => {
      mockZipStorage.checkFreeDiskSpace.mockResolvedValueOnce({ hasSpace: false });

      await expect(
        chunkUploadService.initChunkSession({
          fileName: "stories.zip",
          fileSize: 1000000000,
          totalChunks: 100,
        }),
      ).rejects.toThrow("Dung lượng ổ đĩa không đủ");
    });

    it("should initialize a new chunk session and save to Redis", async () => {
      const result = await chunkUploadService.initChunkSession({
        fileName: "manga.zip",
        fileSize: 20971520, // 20MB
        totalChunks: 2,
        chunkSize: 10485760, // 10MB
        fileHash: "hash_abc_123",
        userId: "user_test_uuid",
      });

      expect(result.sessionId).toMatch(/^session_chunk_/);
      expect(result.fileName).toBe("manga.zip");
      expect(result.totalChunks).toBe(2);
      expect(result.isResumed).toBe(false);
      expect(result.uploadedChunks).toEqual([]);

      // Check redis session
      const savedSessionRaw = await mockRedis.get(`chunk_upload:session:${result.sessionId}`);
      expect(savedSessionRaw).toBeDefined();
      const saved = JSON.parse(savedSessionRaw);
      expect(saved.fileHash).toBe("hash_abc_123");
    });

    it("should resume an existing session if matching fileHash exists", async () => {
      // Setup initial session
      const first = await chunkUploadService.initChunkSession({
        fileName: "manga.zip",
        fileSize: 20971520,
        totalChunks: 2,
        fileHash: "hash_same_file",
      });

      // Simulate chunk 0 uploaded
      await mockRedis.sadd(`chunk_upload:chunks:${first.sessionId}`, "0");

      // User resumes by re-init with same fileHash
      const resumed = await chunkUploadService.initChunkSession({
        fileName: "manga.zip",
        fileSize: 20971520,
        totalChunks: 2,
        fileHash: "hash_same_file",
      });

      expect(resumed.sessionId).toBe(first.sessionId);
      expect(resumed.isResumed).toBe(true);
      expect(resumed.uploadedChunks).toEqual([0]);
    });
  });

  describe("chunkUploadService.getChunkStatus", () => {
    it("should throw 404 if session not found", async () => {
      await expect(chunkUploadService.getChunkStatus({ sessionId: "non_existent" })).rejects.toThrow("Phiên tải lên không tồn tại");
    });

    it("should return uploaded and missing chunks", async () => {
      const init = await chunkUploadService.initChunkSession({
        fileName: "stories.zip",
        fileSize: 3000,
        totalChunks: 3,
      });

      await mockRedis.sadd(`chunk_upload:chunks:${init.sessionId}`, "0");
      await mockRedis.sadd(`chunk_upload:chunks:${init.sessionId}`, "2");

      const status = await chunkUploadService.getChunkStatus({ sessionId: init.sessionId });

      expect(status.totalChunks).toBe(3);
      expect(status.uploadedChunks).toEqual([0, 2]);
      expect(status.missingChunks).toEqual([1]);
      expect(status.isComplete).toBe(false);
    });
  });

  describe("chunkUploadService.saveChunk", () => {
    it("should save uploaded chunk and record in Redis set", async () => {
      const init = await chunkUploadService.initChunkSession({
        fileName: "stories.zip",
        fileSize: 2000,
        totalChunks: 2,
      });

      const mockFile = {
        path: "/tmp/fake/uploads/staging/tmp_1.chunk",
        size: 1000,
      };

      const result = await chunkUploadService.saveChunk({
        sessionId: init.sessionId,
        chunkIndex: 0,
        file: mockFile,
      });

      expect(result.success).toBe(true);
      expect(result.chunkIndex).toBe(0);
      expect(result.uploadedCount).toBe(1);

      // Verify in Redis
      const members = await mockRedis.smembers(`chunk_upload:chunks:${init.sessionId}`);
      expect(members).toContain("0");
    });

    it("should throw 400 if chunkIndex is out of range", async () => {
      const init = await chunkUploadService.initChunkSession({
        fileName: "stories.zip",
        fileSize: 2000,
        totalChunks: 2,
      });

      const mockFile = { path: "/tmp/fake/uploads/staging/tmp_out.chunk" };

      await expect(
        chunkUploadService.saveChunk({
          sessionId: init.sessionId,
          chunkIndex: 5,
          file: mockFile,
        }),
      ).rejects.toThrow("nằm ngoài phạm vi");
    });
  });

  describe("chunkUploadService.completeChunkUpload", () => {
    it("should throw 400 if missing chunks", async () => {
      const init = await chunkUploadService.initChunkSession({
        fileName: "stories.zip",
        fileSize: 2000,
        totalChunks: 2,
      });

      // Only chunk 0 uploaded
      await mockRedis.sadd(`chunk_upload:chunks:${init.sessionId}`, "0");

      await expect(chunkUploadService.completeChunkUpload({ sessionId: init.sessionId })).rejects.toThrow("Chưa nhận đủ tất cả các chunk");
    });

    it("should merge chunks and enqueue BullMQ job when all chunks are uploaded", async () => {
      const init = await chunkUploadService.initChunkSession({
        fileName: "stories.zip",
        fileSize: 2000,
        totalChunks: 2,
        userId: "user_owner",
      });

      await mockRedis.sadd(`chunk_upload:chunks:${init.sessionId}`, "0");
      await mockRedis.sadd(`chunk_upload:chunks:${init.sessionId}`, "1");

      const result = await chunkUploadService.completeChunkUpload({
        sessionId: init.sessionId,
        cleanupAfterProcessing: true,
      });

      expect(mockZipStorage.mergeChunksSequentially).toHaveBeenCalledWith({
        sessionId: init.sessionId,
        totalChunks: 2,
        targetFilePath: `/tmp/fake/uploads/${init.sessionId}.zip`,
      });

      expect(mockStoryQueue.addJob_BatchImportZip).toHaveBeenCalledWith(
        expect.objectContaining({
          zipFilePath: "/tmp/fake/uploads/session_chunk_1.zip",
          originalName: "stories.zip",
          sessionId: init.sessionId,
          userId: "user_owner",
          cleanupAfterProcessing: true,
        }),
      );

      expect(result.fileName).toBe("stories.zip");
      expect(result.fileSize).toBe(20971520);
    });
  });

  describe("Controller handlers", () => {
    it("initChunkUpload controller should return 200 with session details", async () => {
      const req = {
        user: { id: "user_abc" },
        body: {
          fileName: "manga.zip",
          fileSize: 1048576,
          totalChunks: 1,
        },
      };
      const res = { status: vi.fn().mockReturnThis(), json: vi.fn() };
      const next = vi.fn();

      await storyController.initChunkUpload(req, res, next);

      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          data: expect.objectContaining({
            fileName: "manga.zip",
            totalChunks: 1,
          }),
        }),
      );
    });

    it("getChunkStatus controller should return 200 with status", async () => {
      const init = await chunkUploadService.initChunkSession({
        fileName: "manga.zip",
        fileSize: 1000,
        totalChunks: 1,
      });

      const req = { query: { sessionId: init.sessionId } };
      const res = { status: vi.fn().mockReturnThis(), json: vi.fn() };
      const next = vi.fn();

      await storyController.getChunkStatus(req, res, next);

      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          data: expect.objectContaining({
            sessionId: init.sessionId,
          }),
        }),
      );
    });

    it("uploadChunk controller should return 200 after saving chunk", async () => {
      const init = await chunkUploadService.initChunkSession({
        fileName: "manga.zip",
        fileSize: 1000,
        totalChunks: 1,
      });

      const req = {
        body: { sessionId: init.sessionId, chunkIndex: "0" },
        file: { path: "/tmp/fake/uploads/staging/tmp_0.chunk" },
      };
      const res = { status: vi.fn().mockReturnThis(), json: vi.fn() };
      const next = vi.fn();

      await storyController.uploadChunk(req, res, next);

      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          data: expect.objectContaining({
            chunkIndex: 0,
          }),
        }),
      );
    });

    it("completeChunkUpload controller should return 200 upon completion", async () => {
      const init = await chunkUploadService.initChunkSession({
        fileName: "manga.zip",
        fileSize: 1000,
        totalChunks: 1,
      });
      await mockRedis.sadd(`chunk_upload:chunks:${init.sessionId}`, "0");

      const req = {
        user: { id: "user_abc" },
        body: { sessionId: init.sessionId },
      };
      const res = { status: vi.fn().mockReturnThis(), json: vi.fn() };
      const next = vi.fn();

      await storyController.completeChunkUpload(req, res, next);

      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          message: expect.stringContaining("Ghép các chunk thành file zip thành công"),
        }),
      );
    });
  });
});
