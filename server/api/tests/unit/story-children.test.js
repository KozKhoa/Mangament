import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("../../configs/db.js", () => {
  return {
    default: {
      storyNode: {
        findMany: vi.fn(),
      },
      story: {
        update: vi.fn(),
      },
    },
  };
});

vi.mock("../../configs/redis.js", () => ({
  redis: {
    options: { host: "127.0.0.1", port: 6379, password: "" },
    get: vi.fn(),
    setex: vi.fn(),
  },
}));

vi.mock("bullmq", () => ({
  Queue: vi.fn().mockImplementation(function (name) {
    return {
      name,
      add: vi.fn().mockResolvedValue({ id: "job-1" }),
    };
  }),
  Worker: vi.fn().mockImplementation(function (name, processor) {
    return {
      name,
      processor,
      on: vi.fn(),
      close: vi.fn(),
    };
  }),
}));

import db from "../../configs/db.js";
import { BuildStoryChildrenTree, SyncStoryChildren } from "../../src/services/story.service.js";
import storyQueue from "../../worker/queues/story.queue.js";

describe("Story Children Tree (JSONB)", () => {
  const storyId = "dea6007c-3762-468d-b726-f24755842d34";
  const rootNodeId1 = "d95128f1-5551-46c0-943d-55ef5a90eeb2";
  const rootNodeId2 = "f8e6bdc1-8a2d-4319-955b-c25d9e6d1e9b";
  const childNodeId1 = "13fb9a07-8e69-48b0-ba69-4372184de596";
  const childNodeId2 = "b045da84-a2b1-4e36-828f-03cb2683354e";

  const mockDbNodes = [
    {
      id: rootNodeId1,
      story_id: storyId,
      parent_id: null,
      title: "Chương 1: Khởi đầu hành trình",
      type: "chapter",
      order_index: 1,
      number_of_children: 2,
      updated_at: new Date("2026-09-23T13:24:20.192Z"),
      created_at: new Date("2026-09-23T13:24:20.192Z"),
      deleted_status: "not_deleted",
      poster_id: "caf0b263-d648-4bca-877e-a995465f683e",
    },
    {
      id: rootNodeId2,
      story_id: storyId,
      parent_id: null,
      title: "Chương 2: Kẻ thù xuất hiện",
      type: "chapter",
      order_index: 2,
      number_of_children: 0,
      updated_at: new Date("2026-09-23T13:24:20.197Z"),
      created_at: new Date("2026-09-23T13:24:20.197Z"),
      deleted_status: "not_deleted",
      poster_id: "caf0b263-d648-4bca-877e-a995465f683e",
    },
    {
      id: childNodeId1,
      story_id: storyId,
      parent_id: rootNodeId1,
      title: "Chương 8: Tia hy vọng mong manh",
      type: "chapter",
      order_index: 8,
      number_of_children: 0,
      updated_at: new Date("2026-09-23T13:24:20.226Z"),
      created_at: new Date("2026-09-23T13:24:20.226Z"),
      deleted_status: "not_deleted",
      poster_id: "caf0b263-d648-4bca-877e-a995465f683e",
    },
    {
      id: childNodeId2,
      story_id: storyId,
      parent_id: rootNodeId1,
      title: "Chương 9: Vượt qua giới hạn",
      type: "chapter",
      order_index: 9,
      number_of_children: 0,
      updated_at: new Date("2026-09-23T13:24:20.230Z"),
      created_at: new Date("2026-09-23T13:24:20.230Z"),
      deleted_status: "not_deleted",
      poster_id: "caf0b263-d648-4bca-877e-a995465f683e",
    },
  ];

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("BuildStoryChildrenTree", () => {
    it("should return empty array if storyId is missing", async () => {
      const tree = await BuildStoryChildrenTree(null);
      expect(tree).toEqual([]);
    });

    it("should build nested hierarchical tree with exact required fields", async () => {
      db.storyNode.findMany.mockResolvedValue(mockDbNodes);

      const tree = await BuildStoryChildrenTree(storyId, db);

      expect(db.storyNode.findMany).toHaveBeenCalledWith({
        where: {
          story_id: storyId,
          deleted_status: "not_deleted",
        },
        select: {
          id: true,
          story_id: true,
          parent_id: true,
          title: true,
          type: true,
          order_index: true,
          number_of_children: true,
          updated_at: true,
          created_at: true,
          deleted_status: true,
          poster_id: true,
        },
        orderBy: { order_index: "asc" },
      });

      // Top level should only have root nodes (parent_id: null)
      expect(tree).toHaveLength(2);
      expect(tree[0].id).toBe(rootNodeId1);
      expect(tree[0].parent_id).toBeNull();
      expect(tree[0].order_index).toBe(1);

      // Root node 1 should have 2 children
      expect(tree[0].children).toHaveLength(2);
      expect(tree[0].children[0].id).toBe(childNodeId1);
      expect(tree[0].children[0].parent_id).toBe(rootNodeId1);
      expect(tree[0].children[0].title).toBe("Chương 8: Tia hy vọng mong manh");
      expect(tree[0].children[0].children).toEqual([]);

      expect(tree[0].children[1].id).toBe(childNodeId2);
      expect(tree[0].children[1].parent_id).toBe(rootNodeId1);
      expect(tree[0].children[1].title).toBe("Chương 9: Vượt qua giới hạn");
      expect(tree[0].children[1].children).toEqual([]);

      // Root node 2 has no children
      expect(tree[1].id).toBe(rootNodeId2);
      expect(tree[1].parent_id).toBeNull();
      expect(tree[1].children).toEqual([]);
    });
  });

  describe("SyncStoryChildren", () => {
    it("should build tree and update story table", async () => {
      db.storyNode.findMany.mockResolvedValue(mockDbNodes);
      db.story.update.mockResolvedValue({ id: storyId });

      const result = await SyncStoryChildren(storyId, db);

      expect(db.story.update).toHaveBeenCalledWith({
        where: { id: storyId },
        data: { children: result },
      });
      expect(result).toHaveLength(2);
    });
  });

  describe("StoryQueue sync jobs", () => {
    it("should allow adding sync jobs to storyQueue", () => {
      expect(typeof storyQueue.addJob_SyncStoryChildren).toBe("function");
      expect(typeof storyQueue.addJob_SyncManyStoryChildren).toBe("function");

      storyQueue.addJob_SyncStoryChildren(storyId);
      storyQueue.addJob_SyncManyStoryChildren([storyId, "story-2"]);
    });
  });
});
