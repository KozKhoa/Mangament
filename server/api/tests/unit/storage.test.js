import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import fs from "fs";
import path from "path";
import { getStorageProvider, registerStorageProvider, BaseStorageProvider, LocalStorageProvider, R2StorageProvider } from "../../src/storage/index.js";
import { r2 } from "../../configs/r2.js";

// Mock R2 client
vi.mock("../../configs/r2.js", () => ({
  r2: {
    send: vi.fn(),
  },
}));

describe("Storage System", () => {
  const originalEnv = { ...process.env };

  beforeEach(() => {
    vi.clearAllMocks();
    process.env = { ...originalEnv };
  });

  afterEach(() => {
    process.env = originalEnv;
  });

  describe("LocalStorageProvider", () => {
    const local = new LocalStorageProvider();

    it("should generate correct relative path for local storage", () => {
      const p = local.generatePath("stories", "chapter_1.jpg");
      expect(p).toBe("/public/images/stories/chapter_1.jpg");
    });

    it("should generate full URL based on APP_URL or BACKEND_URL", () => {
      process.env.BACKEND_URL = "https://api.mangament.vn";
      const url = local.getUrl("/public/images/stories/chapter_1.jpg");
      expect(url).toBe("https://api.mangament.vn/public/images/stories/chapter_1.jpg");
    });

    it("should fallback to localhost if BACKEND_URL not set", () => {
      delete process.env.APP_URL;
      delete process.env.BACKEND_URL;
      process.env.APP_PORT = "5000";
      const url = local.getUrl("/public/images/stories/chapter_1.jpg");
      expect(url).toBe("http://localhost:5000/public/images/stories/chapter_1.jpg");
    });

    it("should resolve disk path using PUBLIC_DIR when configured", () => {
      process.env.PUBLIC_DIR = "/mnt/external_drive/public";
      const customLocal = new LocalStorageProvider();
      const resolvedStory = customLocal.resolveDiskPath("/public/images/stories/ch1/001.jpg");
      expect(resolvedStory).toBe("/mnt/external_drive/public/images/stories/ch1/001.jpg");

      const resolvedAvatar = customLocal.resolveDiskPath("/public/images/avatars/user.jpg");
      expect(resolvedAvatar).toBe("/mnt/external_drive/public/images/avatars/user.jpg");
    });

    it("should resolve disk path using default public directory when PUBLIC_DIR is not set", () => {
      delete process.env.PUBLIC_DIR;
      const defaultLocal = new LocalStorageProvider();
      const resolved = defaultLocal.resolveDiskPath("/public/images/stories/ch1/001.jpg");
      expect(resolved).toBe(path.join(defaultLocal.baseDir, "images/stories/ch1/001.jpg"));
    });

    it("should upload buffer to local disk", async () => {
      vi.spyOn(fs.promises, "mkdir").mockResolvedValue();
      vi.spyOn(fs.promises, "writeFile").mockResolvedValue();

      const buffer = Buffer.from("test-content");
      const res = await local.upload("/public/images/stories/test.jpg", buffer, "image/jpeg");

      expect(fs.promises.mkdir).toHaveBeenCalled();
      expect(fs.promises.writeFile).toHaveBeenCalled();
      expect(res.path).toBe("/public/images/stories/test.jpg");
      expect(res.size).toBe(buffer.length);
      expect(res.contentType).toBe("image/jpeg");
    });

    it("should delete file from local disk", async () => {
      vi.spyOn(fs, "existsSync").mockReturnValue(true);
      vi.spyOn(fs.promises, "unlink").mockResolvedValue();

      const success = await local.delete("/public/images/stories/test.jpg");
      expect(fs.promises.unlink).toHaveBeenCalled();
      expect(success).toBe(true);
    });

    it("should delete multiple files from local disk", async () => {
      vi.spyOn(fs, "existsSync").mockReturnValue(true);
      vi.spyOn(fs.promises, "unlink").mockResolvedValue();

      const success = await local.deleteMany(["/public/images/stories/test1.jpg", "/public/images/stories/test2.jpg"]);
      expect(fs.promises.unlink).toHaveBeenCalledTimes(2);
      expect(success).toBe(true);
    });
  });

  describe("R2StorageProvider", () => {
    const r2Provider = new R2StorageProvider();

    beforeEach(() => {
      process.env.CLOUDFLARE_R2_BUCKET = "test-bucket";
      process.env.CDN_URL = "https://cdn.example.com";
    });

    it("should generate clean R2 key", () => {
      const p = r2Provider.generatePath("stories", "page_1.jpg");
      expect(p).toBe("stories/page_1.jpg");
    });

    it("should generate CDN URL for R2 key", () => {
      const url = r2Provider.getUrl("stories/page_1.jpg");
      expect(url).toBe("https://cdn.example.com/stories/page_1.jpg");
    });

    it("should upload buffer to R2 bucket via PutObjectCommand", async () => {
      r2.send.mockResolvedValue({});

      const buffer = Buffer.from("test-r2-data");
      const res = await r2Provider.upload("stories/page_1.jpg", buffer, "image/jpeg");

      expect(r2.send).toHaveBeenCalledTimes(1);
      expect(res.path).toBe("stories/page_1.jpg");
      expect(res.url).toBe("https://cdn.example.com/stories/page_1.jpg");
      expect(res.size).toBe(buffer.length);
    });

    it("should delete object from R2 via DeleteObjectCommand", async () => {
      r2.send.mockResolvedValue({});

      const success = await r2Provider.delete("stories/page_1.jpg");
      expect(r2.send).toHaveBeenCalledTimes(1);
      expect(success).toBe(true);
    });

    it("should delete multiple objects from R2 via DeleteObjectsCommand", async () => {
      r2.send.mockResolvedValue({});

      const success = await r2Provider.deleteMany(["stories/1.jpg", "stories/2.jpg"]);
      expect(r2.send).toHaveBeenCalledTimes(1);
      expect(success).toBe(true);
    });
  });

  describe("Storage Factory (getStorageProvider)", () => {
    it("should return LocalStorageProvider by default or when requested", () => {
      delete process.env.STORAGE_PROVIDER;
      const provider = getStorageProvider();
      expect(provider.name).toBe("local");
      expect(provider).toBeInstanceOf(LocalStorageProvider);

      const explicitLocal = getStorageProvider("local");
      expect(explicitLocal.name).toBe("local");
    });

    it("should return R2StorageProvider when STORAGE_PROVIDER=r2", () => {
      process.env.STORAGE_PROVIDER = "r2";
      const provider = getStorageProvider();
      expect(provider.name).toBe("r2");
      expect(provider).toBeInstanceOf(R2StorageProvider);
    });

    it("should return R2StorageProvider when explicitly passing 'r2'", () => {
      process.env.STORAGE_PROVIDER = "local";
      const provider = getStorageProvider("r2");
      expect(provider.name).toBe("r2");
    });

    it("should throw a clear error for unsupported provider", () => {
      expect(() => getStorageProvider("unknown_provider")).toThrow(/Unsupported STORAGE_PROVIDER: 'unknown_provider'/);
    });

    it("should allow registering a custom provider (e.g. S3 / GDrive)", () => {
      class CustomS3Provider extends BaseStorageProvider {
        constructor() {
          super("s3");
        }
        generatePath(cat, fn) {
          return `s3-${cat}/${fn}`;
        }
        getUrl(p) {
          return `https://s3.amazonaws.com/${p}`;
        }
        async upload() {
          return {};
        }
        async delete() {
          return true;
        }
      }

      registerStorageProvider("s3", new CustomS3Provider());
      const custom = getStorageProvider("s3");
      expect(custom.name).toBe("s3");
      expect(custom.generatePath("avatars", "me.png")).toBe("s3-avatars/me.png");
    });
  });
});
