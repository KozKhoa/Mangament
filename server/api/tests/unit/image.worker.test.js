import { describe, it, expect, vi, beforeEach } from "vitest";
import fs from "fs";

// Mock sharp
vi.mock("sharp", () => {
  return {
    default: vi.fn(() => ({
      metadata: vi.fn().mockResolvedValue({ width: 1000, height: 1500, format: "jpeg" }),
      resize: vi.fn().mockReturnThis(),
      jpeg: vi.fn().mockReturnThis(),
      toBuffer: vi.fn().mockResolvedValue(Buffer.from("optimized-image-buffer")),
    })),
  };
});

// Mock BullMQ Worker
const registeredWorkers = new Map();
vi.mock("bullmq", () => {
  return {
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
  };
});

// Mock imageService
const upsertImageMock = vi.fn().mockResolvedValue({ success: true });
vi.mock("../../src/services/image.service.js", () => {
  return {
    UpsertImage: upsertImageMock,
  };
});

// Mock R2Cloudflare
vi.mock("../../src/utils/R2Cloudflare.js", () => {
  return {
    default: {
      uploadObject: vi.fn().mockResolvedValue(),
      deleteObject: vi.fn().mockResolvedValue(),
      deleteManyObjects: vi.fn().mockResolvedValue(),
    },
  };
});

describe("Image Worker Handlers", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.spyOn(fs.promises, "mkdir").mockResolvedValue();
    vi.spyOn(fs.promises, "writeFile").mockResolvedValue();
  });

  it("should process story images and call imageService.AddImage with id and schema fields", async () => {
    // Import worker to register handlers
    await import("../../worker/handlers/image.worker.js");
    const imageService = await import("../../src/services/image.service.js");

    const storyImagesProcessor = registeredWorkers.get("add-story-images");
    expect(storyImagesProcessor).toBeDefined();

    const mockJob = {
      data: {
        images: [
          {
            id: "uuid-story-1",
            filename: "random1_123.jpg",
            path: "/public/images/stories/random1_123.jpg",
            file: {
              originalname: "original_page_1.png",
              mimetype: "image/png",
              buffer: {
                type: "Buffer",
                data: Array.from(Buffer.from("sample-raw-data")),
              },
            },
          },
        ],
        quality: 80,
      },
    };

    await storyImagesProcessor(mockJob);

    // Verify fs.promises.writeFile was called
    expect(fs.promises.writeFile).toHaveBeenCalled();

    // Verify imageService.UpsertImage was called with id matching job
    expect(imageService.UpsertImage).toHaveBeenCalledWith({
      id: "uuid-story-1",
      provider: "local",
      mine_type: "image/jpeg",
      size: Buffer.from("optimized-image-buffer").length,
      path: "/public/images/stories/random1_123.jpg",
      width: 1000,
      height: 1500,
      metadata: {
        original_name: "original_page_1.png",
      },
    });
  });
});
