import { describe, it, expect, vi, beforeEach } from "vitest";
import adminSchemas from "../../src/schemas/admin.schemas.js";

const { mockStoryQueue, mockMailService, mockDb } = vi.hoisted(() => {
  const mockStoryQueue = {
    addJob_UpdateStory: vi.fn().mockResolvedValue({ id: "job-update-123" }),
    addJob_UpdateStoryChildren: vi.fn().mockResolvedValue({ id: "job-update-children-123" }),
  };

  const mockMailService = {
    sendNotificationToUsersWhenStoryUpdated: vi.fn().mockResolvedValue(true),
    sendNotificationWhenStoryUpdated: vi.fn().mockResolvedValue(true),
  };

  const mockDb = {
    story: {
      findUnique: vi.fn(),
      update: vi.fn(),
    },
    genre: {
      findMany: vi.fn().mockResolvedValue([
        { id: "genre-1", name: "action" },
        { id: "genre-2", name: "fantasy" },
        { id: "genre-3", name: "romance" },
      ]),
    },
    story_Genre: {
      deleteMany: vi.fn().mockResolvedValue({ count: 1 }),
      createMany: vi.fn().mockResolvedValue({ count: 2 }),
    },
    story_Author: {
      deleteMany: vi.fn().mockResolvedValue({ count: 1 }),
      createMany: vi.fn().mockResolvedValue({ count: 1 }),
    },
    image: {
      findUnique: vi.fn().mockResolvedValue(null),
      create: vi.fn().mockResolvedValue({ id: "image-mock-id" }),
    },
    $transaction: vi.fn().mockImplementation(async (callback) => callback(mockDb)),
  };

  return { mockStoryQueue, mockMailService, mockDb };
});

// Mock redis
vi.mock("../../configs/redis.js", () => ({
  redis: {
    options: { host: "127.0.0.1", port: 6379 },
    get: vi.fn(),
    set: vi.fn(),
    setex: vi.fn(),
    incr: vi.fn().mockResolvedValue(2),
    del: vi.fn().mockResolvedValue(1),
  },
  connectToRedis: vi.fn(),
}));

vi.mock("../../worker/queues/story.queue.js", () => ({
  default: mockStoryQueue,
}));

vi.mock("../../src/services/mail.service.js", () => ({
  default: mockMailService,
}));

vi.mock("../../configs/db.js", () => ({
  default: mockDb,
  StoryStatus: {
    ongoing: "ongoing",
    completed: "completed",
    drop: "drop",
  },
  StoryType: {
    manga: "manga",
    novel: "novel",
    comic: "comic",
  },
  Gender: {
    male: "male",
    female: "female",
    other: "other",
  },
  Role: {
    admin: "admin",
    user: "user",
  },
}));

describe("Story Update Endpoints (Basic Info & Children)", () => {
  const validStoryId = "11111111-1111-4111-a111-111111111111";
  const validAuthorId = "22222222-2222-4222-a222-222222222222";

  beforeEach(() => {
    vi.clearAllMocks();
  });

  // ==========================================
  // 1. SCHEMA VALIDATION TESTS
  // ==========================================
  describe("Schema Validation", () => {
    describe("adminSchemas.updateStory (Basic Info)", () => {
      it("should pass validation with valid UUID params and metadata payload", () => {
        const payload = {
          params: { id: validStoryId },
          body: {
            title: "New Story Title",
            other_titles: ["Title 1", "Title 2"],
            type: "manga",
            nation: { name: "Japan" },
            summary: "Updated story summary",
            status: "ongoing",
            genre: ["action", "fantasy"],
            authorIds: [validAuthorId],
            coverArt: {
              path: "https://r2.example.com/stories/cover.jpg",
              provider: "r2",
              width: 800,
              height: 1200,
            },
          },
        };

        const result = adminSchemas.updateStory.safeParse(payload);
        expect(result.success).toBe(true);
      });

      it("should pass validation with only coverArt in body", () => {
        const payload = {
          params: { id: validStoryId },
          body: {
            coverArt: {
              id: "33333333-3333-4333-a333-333333333333",
              path: "https://r2.example.com/stories/new-cover.jpg",
              provider: "r2",
            },
          },
        };

        const result = adminSchemas.updateStory.safeParse(payload);
        expect(result.success).toBe(true);
      });

      it("should fail validation if params.id is not a valid UUID", () => {
        const payload = {
          params: { id: "invalid-uuid-123" },
          body: {
            title: "Some Title",
          },
        };

        const result = adminSchemas.updateStory.safeParse(payload);
        expect(result.success).toBe(false);
      });
    });

    describe("adminSchemas.updateStoryChildren", () => {
      it("should pass validation with valid children object", () => {
        const payload = {
          params: { id: validStoryId },
          body: {
            children: {
              delete: { story_node: [], content: [] },
              add: { story_node: [], content: [] },
              edit: { story_node: [], content: [] },
            },
          },
        };

        const result = adminSchemas.updateStoryChildren.safeParse(payload);
        expect(result.success).toBe(true);
      });

      it("should fail validation if children is missing", () => {
        const payload = {
          params: { id: validStoryId },
          body: {},
        };

        const result = adminSchemas.updateStoryChildren.safeParse(payload);
        expect(result.success).toBe(false);
      });
    });
  });

  // ==========================================
  // 2. CONTROLLER UNIT TESTS
  // ==========================================
  describe("Controller", () => {
    let controller;

    beforeEach(async () => {
      controller = await import("../../src/controllers/admin/story.controller.js");
      mockDb.story.findUnique.mockResolvedValue({
        id: validStoryId,
        title: "Existing Title",
      });
      mockDb.story.update.mockResolvedValue({
        id: validStoryId,
        title: "Solo Leveling Remastered",
      });
    });

    describe("updateStory (PUT /admin/stories/:id)", () => {
      it("should update story basic info immediately and return result", async () => {
        const req = {
          params: { id: validStoryId },
          body: {
            title: "Solo Leveling Remastered",
            other_titles: ["Tôi Thăng Cấp Một Mình", "Na Honman Level Up"],
            type: "manga",
            status: "ongoing",
            genre: ["action", "fantasy"],
            nation: { name: "Korea" },
            summary: "Thợ săn yếu nhất trở thành mạnh nhất thế giới.",
            coverArt: {
              path: "/uploads/stories/solo-leveling-cover.jpg",
              provider: "r2",
              mine_type: "image/jpeg",
              width: 600,
              height: 900,
              size: 204800,
            },
          },
        };

        const res = {
          status: vi.fn().mockReturnThis(),
          json: vi.fn(),
        };
        const next = vi.fn();

        await controller.updateStory(req, res, next);

        expect(mockDb.story.update).toHaveBeenCalledWith(
          expect.objectContaining({
            where: { id: validStoryId },
            data: expect.objectContaining({
              title: "Solo Leveling Remastered",
              type: "manga",
              status: "ongoing",
              nation: { connect: { name: "Korea" } },
            }),
          }),
        );

        expect(res.json).toHaveBeenCalledWith(
          expect.objectContaining({
            success: true,
            message: "Update story successfully",
          }),
        );
        expect(next).not.toHaveBeenCalled();
      });

      it("should forward error to next if genre is invalid", async () => {
        const req = {
          params: { id: validStoryId },
          body: {
            genre: ["invalid_unknown_genre_xyz"],
          },
        };
        const res = { status: vi.fn().mockReturnThis(), json: vi.fn() };
        const next = vi.fn();

        await controller.updateStory(req, res, next);

        expect(next).toHaveBeenCalledWith(
          expect.objectContaining({
            status: 400,
            message: expect.stringContaining("not valid genre"),
          }),
        );
      });
    });

    describe("updateStoryChildren (PUT /admin/stories/:id/children)", () => {
      it("should enqueue children update to worker queue", async () => {
        const req = {
          user: { email: "admin@mangament.com" },
          params: { id: validStoryId },
          body: {
            children: {
              add: { story_node: [{ title: "Chapter 1" }] },
            },
          },
        };
        const res = { status: vi.fn().mockReturnThis(), json: vi.fn() };
        const next = vi.fn();

        await controller.updateStoryChildren(req, res, next);

        expect(mockStoryQueue.addJob_UpdateStoryChildren).toHaveBeenCalledWith(
          validStoryId,
          expect.objectContaining({
            add: { story_node: [{ title: "Chapter 1" }] },
          }),
          "admin@mangament.com",
        );

        expect(res.json).toHaveBeenCalledWith(
          expect.objectContaining({
            success: true,
            message: expect.stringContaining("Story children is being updated"),
          }),
        );
      });
    });
  });

  // ==========================================
  // 3. SERVICE UNIT TESTS
  // ==========================================
  describe("Service", () => {
    let storyService;

    beforeEach(async () => {
      storyService = await import("../../src/services/story.service.js");
      mockDb.story.findUnique.mockResolvedValue({ id: validStoryId, title: "Old Title" });
      mockDb.story.update.mockResolvedValue({ id: validStoryId, title: "New Title" });
    });

    describe("UpdateStory (Basic Info - Synchronous)", () => {
      it("should update story in db transaction and notify users", async () => {
        const result = await storyService.UpdateStory(validStoryId, {
          title: "New Title",
          otherTitles: ["  Duplicate Title  ", "Duplicate Title", "Another Title"],
          coverArt: { path: "cover.png" },
        });

        expect(result).toEqual(
          expect.objectContaining({
            success: true,
            message: "Update story successfully",
          }),
        );
        expect(mockDb.story.update).toHaveBeenCalledWith(
          expect.objectContaining({
            where: { id: validStoryId },
            data: expect.objectContaining({
              title: "New Title",
              other_titles: ["Duplicate Title", "Another Title"],
            }),
            select: expect.objectContaining({
              id: true,
              title: true,
              other_titles: true,
              cover_art: expect.any(Object),
            }),
          }),
        );
        const passedSelect = mockDb.story.update.mock.calls[0][0].select;
        expect(passedSelect.summary).toBeUndefined();
        expect(passedSelect.status).toBeUndefined();
        expect(passedSelect.type).toBeUndefined();
        expect(passedSelect.nation).toBeUndefined();
        expect(mockMailService.sendNotificationToUsersWhenStoryUpdated).toHaveBeenCalledWith(validStoryId);
      });

      it("should throw 400 error if story does not exist", async () => {
        mockDb.story.findUnique.mockResolvedValue(null);

        await expect(
          storyService.UpdateStory(validStoryId, {
            title: "Non-existent Story",
          }),
        ).rejects.toMatchObject({
          status: 400,
          message: "Story not found",
        });
      });
    });

    describe("UpdateStoryChildren (Background Job)", () => {
      it("should add job to updateStoryChildren queue", async () => {
        const result = await storyService.UpdateStoryChildren(
          validStoryId,
          { edit: { story_node: [] } },
          "admin@mangament.com",
        );

        expect(result).toEqual({ success: true, message: "Story children is being updated" });
        expect(mockStoryQueue.addJob_UpdateStoryChildren).toHaveBeenCalledWith(
          validStoryId,
          { edit: { story_node: [] } },
          "admin@mangament.com",
        );
      });
    });
  });
});
