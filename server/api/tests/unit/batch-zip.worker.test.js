import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import fs from "fs";
import path from "path";
import os from "os";

// Track registered bullmq workers
const registeredWorkers = new Map();
vi.mock("bullmq", () => ({
  Worker: vi.fn().mockImplementation(function (queueName, processor) {
    registeredWorkers.set(queueName, processor);
    return {
      on: vi.fn(),
      close: vi.fn(),
    };
  }),
  Queue: vi.fn().mockImplementation(function () {
    return {
      add: vi.fn(),
    };
  }),
}));

// Mock db
const mockDb = {
  nation: {
    findUnique: vi.fn(),
    findFirst: vi.fn(),
  },
  image: {
    findUnique: vi.fn(),
    create: vi.fn(),
  },
  story: {
    findUnique: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
  },
  storyNode: {
    findFirst: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
  },
  storyNodeContent: {
    create: vi.fn(),
  },
  user: {
    findUnique: vi.fn(),
  },
  genre: {
    findFirst: vi.fn(),
  },
  author: {
    findUnique: vi.fn(),
  },
  story_Genre: {
    createMany: vi.fn(),
  },
  story_Author: {
    createMany: vi.fn(),
  },
};

vi.mock("../../configs/db.js", () => ({
  default: mockDb,
}));

vi.mock("../../src/services/story.service.js", () => ({
  SyncStoryChildren: vi.fn().mockResolvedValue([]),
}));

vi.mock("../../src/utils/Redis.js", () => ({
  default: {
    stories: vi.fn(() => ({
      incr: vi.fn().mockResolvedValue(1),
      get: vi.fn().mockResolvedValue(1),
    })),
    storyNodes: vi.fn(() => ({
      incr: vi.fn().mockResolvedValue(1),
      get: vi.fn().mockResolvedValue(1),
    })),
    genres: vi.fn(() => ({
      incr: vi.fn().mockResolvedValue(1),
      get: vi.fn().mockResolvedValue(1),
    })),
    authors: vi.fn(() => ({
      incr: vi.fn().mockResolvedValue(1),
      get: vi.fn().mockResolvedValue(1),
    })),
    clearStoriesCache: vi.fn().mockResolvedValue(),
  },
}));

vi.mock("../../worker/queues/story.queue.js", () => ({
  default: {
    addJob_EmbeddingStory: vi.fn(),
    addJob_SyncStoryChildren: vi.fn(),
    addJob_BatchImportZip: vi.fn(),
  },
}));

describe("Batch Import Zip Worker & Image Handling", () => {
  let testTempDir;
  let testPublicDir;
  let storyWorkerModule;

  beforeEach(async () => {
    vi.clearAllMocks();

    testTempDir = fs.mkdtempSync(path.join(os.tmpdir(), "mangament-zip-test-"));
    testPublicDir = fs.mkdtempSync(path.join(os.tmpdir(), "mangament-public-test-"));

    process.env.TEMP_DIR = testTempDir;
    process.env.PUBLIC_DIR = testPublicDir;

    mockDb.user.findUnique.mockResolvedValue({ id: "valid-user-id" });
    mockDb.nation.findFirst.mockResolvedValue(null);
    mockDb.nation.findUnique.mockResolvedValue(null);
    mockDb.image.findUnique.mockResolvedValue(null);
    mockDb.story.findUnique.mockResolvedValue(null);
    mockDb.storyNode.findFirst.mockResolvedValue(null);

    mockDb.image.create.mockImplementation(({ data }) =>
      Promise.resolve({
        id: data.id || "created-image-id",
        ...data,
      }),
    );

    mockDb.story.create.mockImplementation(({ data }) =>
      Promise.resolve({
        id: "created-story-id",
        ...data,
      }),
    );

    mockDb.storyNode.create.mockImplementation(({ data }) =>
      Promise.resolve({
        id: "created-node-id",
        ...data,
      }),
    );

    mockDb.storyNodeContent.create.mockImplementation(({ data }) =>
      Promise.resolve({
        id: "created-content-id",
        ...data,
      }),
    );

    // Import story worker
    storyWorkerModule = await import("../../worker/handlers/story.worker.js");
  });

  afterEach(() => {
    delete process.env.TEMP_DIR;
    delete process.env.PUBLIC_DIR;

    try {
      fs.rmSync(testTempDir, { recursive: true, force: true });
      fs.rmSync(testPublicDir, { recursive: true, force: true });
    } catch {
      // ignore cleanup errors
    }
  });

  it("should register batch-import-zip worker in BullMQ", () => {
    expect(registeredWorkers.has("batch-import-zip")).toBe(true);
  });

  it("should import cover_art_path and story_node_content_image_path relative to CSV directory", async () => {
    // Prepare dummy CSV and dummy images on disk
    const csvDir = path.join(testTempDir, "csv_data");
    const coversDir = path.join(csvDir, "images", "covers");
    const chaptersDir = path.join(csvDir, "images", "ch1");
    fs.mkdirSync(coversDir, { recursive: true });
    fs.mkdirSync(chaptersDir, { recursive: true });

    const coverFile = path.join(coversDir, "solo_cover.png");
    const pageFile = path.join(chaptersDir, "page1.png");

    fs.writeFileSync(coverFile, "fake cover image bytes");
    fs.writeFileSync(pageFile, "fake chapter page bytes");

    const rows = [
      {
        story: {
          title: "Solo Leveling",
          type: "manga",
          status: "ongoing",
          cover_art_path: "images/covers/solo_cover.png",
        },
        nodes: [
          {
            title: "Chapter 1",
            type: "chapter",
            order_index: 1,
            content: {
              order_index: 1,
              type: "image",
              image_path: "images/ch1/page1.png",
            },
          },
        ],
      },
    ];

    const result = await storyWorkerModule.executeBatchImportRows({
      rows,
      userId: "valid-user-id",
      fileName: "test.csv",
      csvDir,
    });

    expect(result.importedStoriesCount).toBe(1);
    expect(result.importedNodesCount).toBe(1);
    expect(result.importedContentsCount).toBe(1);

    // Verify Image records created
    expect(mockDb.image.create).toHaveBeenCalledTimes(2);

    // 1. Cover Art Image
    const coverImageCall = mockDb.image.create.mock.calls[0][0].data;
    expect(coverImageCall.provider).toBe("local");
    expect(coverImageCall.mine_type).toBe("image/png");
    expect(coverImageCall.path).toMatch(/^\/public\/images\/stories\/cover_/);

    // 2. Story created with cover_art_id
    expect(mockDb.story.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          title: "Solo Leveling",
          cover_art_id: coverImageCall.id,
        }),
      }),
    );

    // 3. Node Content Image
    const contentImageCall = mockDb.image.create.mock.calls[1][0].data;
    expect(contentImageCall.provider).toBe("local");
    expect(contentImageCall.mine_type).toBe("image/png");
    expect(contentImageCall.path).toMatch(/^\/public\/images\/stories\//);

    // 4. Content created with image_id
    expect(mockDb.storyNodeContent.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          image_id: contentImageCall.id,
          type: "image",
        }),
      }),
    );

    // Verify files copied to PUBLIC_DIR/images/stories
    const publicStoriesDir = path.join(testPublicDir, "images", "stories");
    expect(fs.existsSync(publicStoriesDir)).toBe(true);
    const copiedFiles = fs.readdirSync(publicStoriesDir);
    expect(copiedFiles.length).toBe(2);
  });

  it("should process a zip file in batchImportZipWorker and clean up when cleanupAfterProcessing is true", async () => {
    const handler = registeredWorkers.get("batch-import-zip");
    expect(handler).toBeDefined();

    // Prepare simulated extraction environment by mocking extractZipArchive
    const zipStorage = await import("../../src/utils/zip/zipStorage.js");

    const dummyZipPath = path.join(testTempDir, "uploads", "test_job.zip");
    fs.mkdirSync(path.dirname(dummyZipPath), { recursive: true });
    fs.writeFileSync(dummyZipPath, "zip binary");

    // Spy on extractZipArchive to write dummy extracted files into the target folder
    const extractSpy = vi.spyOn(zipStorage, "extractZipArchive").mockImplementation(async (zipPath, destDir) => {
      fs.mkdirSync(destDir, { recursive: true });
      const csvPath = path.join(destDir, "stories.csv");
      fs.writeFileSync(csvPath, "title,story_node_title,story_node_type,story_node_order_index\nOne Piece,Chapter 1,chapter,1");
      return { success: true, destinationDir: destDir };
    });

    const job = {
      id: "job-zip-1",
      data: {
        zipFilePath: dummyZipPath,
        originalName: "manga_pack.zip",
        userId: "valid-user-id",
        sessionId: "sess_job_1",
        cleanupAfterProcessing: true,
      },
    };

    await handler(job);

    expect(extractSpy).toHaveBeenCalled();
    expect(mockDb.story.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          title: "One Piece",
        }),
      }),
    );

    // Zip file should be removed
    expect(fs.existsSync(dummyZipPath)).toBe(false);

    extractSpy.mockRestore();
  });
});
