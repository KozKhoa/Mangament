import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import fs from "fs";
import path from "path";
import os from "os";
import {
  getTempDir,
  checkFreeDiskSpace,
  safeUnlink,
  createZipDiskStorageEngine,
  downloadZipFromUrl,
  findCsvInDirectory,
  cleanupOrMoveProcessedZip,
} from "../../src/utils/zip/zipStorage.js";

describe("Zip Storage Utility", () => {
  let testTempDir;

  beforeEach(() => {
    testTempDir = fs.mkdtempSync(path.join(os.tmpdir(), "mangament-test-temp-"));
    process.env.TEMP_DIR = testTempDir;
  });

  afterEach(async () => {
    delete process.env.TEMP_DIR;
    await safeUnlink(testTempDir);
  });

  it("should create uploads, processing, and completed directories under TEMP_DIR", () => {
    const { root, uploadsDir, processingDir, completedDir } = getTempDir();

    expect(root).toBe(path.resolve(testTempDir));
    expect(fs.existsSync(uploadsDir)).toBe(true);
    expect(fs.existsSync(processingDir)).toBe(true);
    expect(fs.existsSync(completedDir)).toBe(true);
  });

  it("should check free disk space using statfs", async () => {
    const { uploadsDir } = getTempDir();
    const result = await checkFreeDiskSpace(uploadsDir);

    expect(result).toHaveProperty("hasSpace");
    expect(result).toHaveProperty("availableBytes");
    expect(typeof result.hasSpace).toBe("boolean");
    expect(result.availableBytes).toBeGreaterThanOrEqual(0);
  });

  it("should report insufficient space when requiredBytes exceeds available disk space", async () => {
    const { uploadsDir } = getTempDir();
    // Demand 100 Petabytes
    const result = await checkFreeDiskSpace(uploadsDir, 100 * 1024 * 1024 * 1024 * 1024 * 1024);

    expect(result.hasSpace).toBe(false);
  });

  it("should find the primary CSV in a nested directory and prioritize stories.csv", async () => {
    const subDir = path.join(testTempDir, "extracted", "subfolder");
    fs.mkdirSync(subDir, { recursive: true });

    const otherCsv = path.join(subDir, "other.csv");
    const storiesCsv = path.join(testTempDir, "extracted", "stories.csv");

    fs.writeFileSync(otherCsv, "title\nOther");
    fs.writeFileSync(storiesCsv, "title\nStories");

    const found = await findCsvInDirectory(path.join(testTempDir, "extracted"));
    expect(found).toBe(storiesCsv);
  });

  it("should remove zip and processing dir when cleanupAfterProcessing is true", async () => {
    const dummyZip = path.join(testTempDir, "test.zip");
    const dummyProcessing = path.join(testTempDir, "processing_dir");
    fs.writeFileSync(dummyZip, "zip-content");
    fs.mkdirSync(dummyProcessing);
    fs.writeFileSync(path.join(dummyProcessing, "file.txt"), "extracted");

    await cleanupOrMoveProcessedZip({
      zipFilePath: dummyZip,
      processingDir: dummyProcessing,
      sessionId: "session_123",
      cleanupAfterProcessing: true,
    });

    expect(fs.existsSync(dummyZip)).toBe(false);
    expect(fs.existsSync(dummyProcessing)).toBe(false);
  });

  it("should move zip to completed folder and remove processing dir when cleanupAfterProcessing is false", async () => {
    const dummyZip = path.join(testTempDir, "test.zip");
    const dummyProcessing = path.join(testTempDir, "processing_dir");
    fs.writeFileSync(dummyZip, "zip-content");
    fs.mkdirSync(dummyProcessing);

    await cleanupOrMoveProcessedZip({
      zipFilePath: dummyZip,
      processingDir: dummyProcessing,
      sessionId: "session_456",
      cleanupAfterProcessing: false,
    });

    expect(fs.existsSync(dummyZip)).toBe(false);
    expect(fs.existsSync(dummyProcessing)).toBe(false);

    const completedZip = path.join(testTempDir, "completed", "session_456", "test.zip");
    expect(fs.existsSync(completedZip)).toBe(true);
  });

  describe("createZipDiskStorageEngine", () => {
    it("should successfully write file stream to disk", async () => {
      const storage = createZipDiskStorageEngine();
      const { Readable } = await import("stream");

      const fileContent = Buffer.from("simulated zip file content");
      const fileStream = Readable.from([fileContent]);

      const req = { body: { sessionId: "sess_upload_test" } };
      const file = {
        originalname: "test_upload.zip",
        stream: fileStream,
      };

      const result = await new Promise((resolve, reject) => {
        storage._handleFile(req, file, (err, info) => {
          if (err) reject(err);
          else resolve(info);
        });
      });

      expect(result).toBeDefined();
      expect(result.size).toBe(fileContent.length);
      expect(result.sessionId).toBe("sess_upload_test");
      expect(fs.existsSync(result.path)).toBe(true);
    });

    it("should immediately abort and delete file when out of disk space error occurs", async () => {
      const storage = createZipDiskStorageEngine();
      const { Readable } = await import("stream");

      const fileStream = new Readable({
        read() {
          this.push(Buffer.from("some chunk"));
          // Emit error simulating ENOSPC
          const err = new Error("No space left on device");
          err.code = "ENOSPC";
          this.destroy(err);
        },
      });

      const req = { body: { sessionId: "sess_enospc_test" } };
      const file = {
        originalname: "too_large.zip",
        stream: fileStream,
      };

      await expect(
        new Promise((resolve, reject) => {
          storage._handleFile(req, file, (err, info) => {
            if (err) reject(err);
            else resolve(info);
          });
        }),
      ).rejects.toThrow("dung lượng đĩa không đủ");

      const { uploadsDir } = getTempDir();
      const expectedPath = path.join(uploadsDir, "sess_enospc_test.zip");
      expect(fs.existsSync(expectedPath)).toBe(false);
    });
  });

  describe("downloadZipFromUrl", () => {
    it("should download stream to diskStorage and return file details", async () => {
      const mockData = "remote zip file binary data";
      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        status: 200,
        headers: new Headers({ "content-length": String(mockData.length) }),
        body: {
          getReader() {
            let done = false;
            return {
              async read() {
                if (done) return { done: true, value: undefined };
                done = true;
                return { done: false, value: Buffer.from(mockData) };
              },
            };
          },
        },
      });

      const res = await downloadZipFromUrl("https://example.com/story.zip", { sessionId: "sess_download_1" });
      expect(res.size).toBe(mockData.length);
      expect(res.sessionId).toBe("sess_download_1");
      expect(fs.existsSync(res.filePath)).toBe(true);
    });

    it("should delete partial file and throw error if download fails or content too large", async () => {
      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        status: 200,
        // Claim 999 Terabytes
        headers: new Headers({ "content-length": String(999 * 1024 * 1024 * 1024 * 1024) }),
        body: null,
      });

      await expect(downloadZipFromUrl("https://example.com/huge.zip", { sessionId: "sess_huge" })).rejects.toThrow("File quá lớn hoặc dung lượng đĩa không đủ");

      const { uploadsDir } = getTempDir();
      expect(fs.existsSync(path.join(uploadsDir, "sess_huge.zip"))).toBe(false);
    });
  });
});
