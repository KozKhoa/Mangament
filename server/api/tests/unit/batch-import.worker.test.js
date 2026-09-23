import { describe, it, expect, vi, beforeEach } from "vitest";

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

// Mock story queue
const addJobEmbeddingMock = vi.fn();
const addJobSyncStoryChildrenMock = vi.fn();
vi.mock("../../worker/queues/story.queue.js", () => ({
  default: {
    addJob_EmbeddingStory: addJobEmbeddingMock,
    addJob_SyncStoryChildren: addJobSyncStoryChildrenMock,
  },
}));

// Mock redis utils
vi.mock("../../src/utils/Redis.js", () => ({
  default: {
    stories: vi.fn(() => ({
      incr: vi.fn().mockResolvedValue(1),
    })),
  },
}));

describe("Batch Import Stories Worker", () => {
  let batchImportWorkerHandler;

  beforeEach(async () => {
    vi.clearAllMocks();
    await import("../../worker/handlers/story.worker.js");
    batchImportWorkerHandler = registeredWorkers.get("batch-import-stories");
  });

  it("should be registered in BullMQ handlers", () => {
    expect(batchImportWorkerHandler).toBeDefined();
  });

  it("should create Story, Parent Node, and Child Node with parent_id = parentNode.id", async () => {
    const validNationId = "11111111-1111-4111-8111-111111111111";
    const validCoverArtId = "22222222-2222-4222-8222-222222222222";
    const validContentImageId = "33333333-3333-4333-8333-333333333333";
    const validUserId = "44444444-4444-4444-8444-444444444444";

    mockDb.user.findUnique.mockResolvedValue({ id: validUserId });
    mockDb.nation.findUnique.mockResolvedValue({ id: validNationId, name: "Japan" });
    mockDb.image.findUnique.mockImplementation(async ({ where: { id } }) => {
      if (id === validCoverArtId || id === validContentImageId) {
        return { id };
      }
      return null;
    });

    const createdStory = { id: "story-uuid-1", title: "Kimetsu no Yaiba" };
    mockDb.story.findUnique.mockResolvedValue(null);
    mockDb.story.create.mockResolvedValue(createdStory);
    mockDb.story.update.mockResolvedValue(createdStory);

    const createdParentNode = { id: "node-parent-uuid", title: "Volume 1", order_index: 1 };
    const createdChildNode = { id: "node-child-uuid", title: "Chapter 1", order_index: 1 };

    mockDb.storyNode.findFirst.mockResolvedValue(null);
    mockDb.storyNode.create.mockResolvedValueOnce(createdParentNode).mockResolvedValueOnce(createdChildNode);
    mockDb.storyNode.update.mockResolvedValue(createdParentNode);
    mockDb.storyNodeContent.create.mockResolvedValue({ id: "content-uuid" });

    const job = {
      data: {
        userId: validUserId,
        fileName: "stories_batch.xlsx",
        rows: [
          {
            story: {
              title: "Kimetsu no Yaiba",
              other_titles: ["Demon Slayer"],
              type: "manga",
              status: "finished",
              nation_id: validNationId,
              nation: "Japan",
              deleted_status: "not_deleted",
              is_actived: true,
              summary: "Tanjiro fights demons",
              cover_art_id: validCoverArtId,
            },
            parentNode: {
              title: "Volume 1",
              type: "volume",
              order_index: 1,
              deleted_status: "not_deleted",
              content: null,
            },
            childNode: {
              title: "Chapter 1",
              type: "chapter",
              order_index: 1,
              deleted_status: "not_deleted",
              content: {
                order_index: 1,
                type: "image",
                content: null,
                image_id: validContentImageId,
                deleted_status: "not_deleted",
              },
            },
          },
        ],
      },
    };

    await batchImportWorkerHandler(job);

    // Verify Story created
    expect(mockDb.story.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        title: "Kimetsu no Yaiba",
        type: "manga",
        status: "finished",
        nation_id: validNationId,
        cover_art_id: validCoverArtId,
        poster_id: validUserId,
      }),
    });

    // Verify Parent Node created with parent_id: null
    expect(mockDb.storyNode.create).toHaveBeenNthCalledWith(1, {
      data: expect.objectContaining({
        story_id: "story-uuid-1",
        parent_id: null,
        title: "Volume 1",
        type: "volume",
        order_index: 1,
      }),
    });

    // Verify Child Node created with parent_id = parentNode.id
    expect(mockDb.storyNode.create).toHaveBeenNthCalledWith(2, {
      data: expect.objectContaining({
        story_id: "story-uuid-1",
        parent_id: "node-parent-uuid",
        title: "Chapter 1",
        type: "chapter",
        order_index: 1,
      }),
    });

    // Verify Child Content created with image_id
    expect(mockDb.storyNodeContent.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        story_node_id: "node-child-uuid",
        type: "image",
        image_id: validContentImageId,
      }),
    });

    // Verify embedding triggered
    expect(addJobEmbeddingMock).toHaveBeenCalledWith("story-uuid-1");
  });

  it("should fallback to finding nation by name when nation_id is empty, or set null if not found", async () => {
    mockDb.nation.findFirst.mockImplementation(async ({ where: { name } }) => {
      if (name.equals === "Vietnam") {
        return { id: "vietnam-nation-uuid", name: "Vietnam" };
      }
      return null;
    });

    mockDb.story.findUnique.mockResolvedValue(null);
    mockDb.story.create.mockResolvedValue({ id: "story-vn" });

    const job = {
      data: {
        userId: "admin-id",
        rows: [
          {
            story: {
              title: "Thần Thoại Việt Nam",
              nation_id: null,
              nation: "Vietnam",
              type: "manga",
            },
          },
          {
            story: {
              title: "Unknown Land Story",
              nation_id: null,
              nation: "Atlantis",
              type: "manga",
            },
          },
        ],
      },
    };

    await batchImportWorkerHandler(job);

    // Row 1 should have nation_id found by name
    expect(mockDb.story.create).toHaveBeenNthCalledWith(1, {
      data: expect.objectContaining({
        title: "Thần Thoại Việt Nam",
        nation_id: "vietnam-nation-uuid",
      }),
    });

    // Row 2 nation "Atlantis" does not exist in DB -> should leave nation_id: null
    expect(mockDb.story.create).toHaveBeenNthCalledWith(2, {
      data: expect.objectContaining({
        title: "Unknown Land Story",
        nation_id: null,
      }),
    });
  });

  it("should leave cover_art_id and content image_id null if image is not found in DB", async () => {
    mockDb.image.findUnique.mockResolvedValue(null); // image doesn't exist
    mockDb.story.findUnique.mockResolvedValue(null);
    mockDb.story.create.mockResolvedValue({ id: "story-test" });
    mockDb.storyNode.findFirst.mockResolvedValue(null);
    mockDb.storyNode.create.mockResolvedValue({ id: "node-test" });
    mockDb.story.update.mockResolvedValue({});

    const job = {
      data: {
        userId: "admin-id",
        rows: [
          {
            story: {
              title: "Story with missing image",
              type: "manga",
              cover_art_id: "99999999-9999-4999-8999-999999999999",
            },
            parentNode: {
              title: "Chapter 1",
              type: "chapter",
              order_index: 1,
              content: {
                order_index: 1,
                type: "image",
                image_id: "88888888-8888-4888-8888-888888888888",
              },
            },
          },
        ],
      },
    };

    await batchImportWorkerHandler(job);

    // cover_art_id should be null
    expect(mockDb.story.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        cover_art_id: null,
      }),
    });

    // content image_id should be null
    expect(mockDb.storyNodeContent.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        image_id: null,
      }),
    });
  });

  it("should handle 3-level nested nodes linking parent_id sequentially", async () => {
    mockDb.story.findUnique.mockResolvedValue(null);
    mockDb.story.create.mockResolvedValue({ id: "story-uuid-3levels", title: "Nested Story" });
    mockDb.story.update.mockResolvedValue({});

    const node1 = { id: "node-level-1", title: "Volume 1" };
    const node2 = { id: "node-level-2", title: "Chapter 1" };
    const node3 = { id: "node-level-3", title: "Part 1" };

    mockDb.storyNode.findFirst.mockResolvedValue(null);
    mockDb.storyNode.create.mockResolvedValueOnce(node1).mockResolvedValueOnce(node2).mockResolvedValueOnce(node3);
    mockDb.storyNode.update.mockResolvedValue({});

    const job = {
      data: {
        userId: "admin-id",
        rows: [
          {
            story: { title: "Nested Story", type: "manga" },
            nodes: [
              { title: "Volume 1", type: "volume", order_index: 1 },
              { title: "Chapter 1", type: "chapter", order_index: 1 },
              { title: "Part 1", type: "chapter", order_index: 1 },
            ],
          },
        ],
      },
    };

    await batchImportWorkerHandler(job);

    // Node 1: parent_id = null
    expect(mockDb.storyNode.create).toHaveBeenNthCalledWith(1, {
      data: expect.objectContaining({
        story_id: "story-uuid-3levels",
        parent_id: null,
        title: "Volume 1",
        type: "volume",
      }),
    });

    // Node 2: parent_id = node1.id
    expect(mockDb.storyNode.create).toHaveBeenNthCalledWith(2, {
      data: expect.objectContaining({
        story_id: "story-uuid-3levels",
        parent_id: "node-level-1",
        title: "Chapter 1",
        type: "chapter",
      }),
    });

    // Node 3: parent_id = node2.id
    expect(mockDb.storyNode.create).toHaveBeenNthCalledWith(3, {
      data: expect.objectContaining({
        story_id: "story-uuid-3levels",
        parent_id: "node-level-2",
        title: "Part 1",
        type: "chapter",
      }),
    });
  });

  it("should import story-only without creating any nodes", async () => {
    mockDb.story.findUnique.mockResolvedValue(null);
    mockDb.story.create.mockResolvedValue({ id: "story-only-id", title: "Story Without Nodes" });

    const job = {
      data: {
        userId: "admin-id",
        rows: [
          {
            story: { title: "Story Without Nodes", type: "manga" },
            nodes: [],
          },
        ],
      },
    };

    await batchImportWorkerHandler(job);

    expect(mockDb.story.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        title: "Story Without Nodes",
      }),
    });
    expect(mockDb.storyNode.create).not.toHaveBeenCalled();
    expect(mockDb.storyNodeContent.create).not.toHaveBeenCalled();
  });

  it("should attach nodes to an existing story without recreating the story", async () => {
    const existingStory = { id: "existing-story-id", title: "Existing Story" };
    mockDb.story.findUnique.mockResolvedValue(existingStory);
    mockDb.storyNode.findFirst.mockResolvedValue(null);
    mockDb.storyNode.create.mockResolvedValue({ id: "new-node-id", title: "New Chapter" });
    mockDb.story.update.mockResolvedValue({});

    const job = {
      data: {
        userId: "admin-id",
        rows: [
          {
            story: { title: "Existing Story" },
            nodes: [{ title: "New Chapter", type: "chapter", order_index: 5 }],
          },
        ],
      },
    };

    await batchImportWorkerHandler(job);

    // Should NOT create story because it already exists
    expect(mockDb.story.create).not.toHaveBeenCalled();
    // Should create node attached to existing story
    expect(mockDb.storyNode.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        story_id: "existing-story-id",
        parent_id: null,
        title: "New Chapter",
        order_index: 5,
      }),
    });
  });

  it("should set poster_id to null when userId is invalid or not found in User table", async () => {
    mockDb.user.findUnique.mockResolvedValue(null); // User does not exist
    mockDb.story.findUnique.mockResolvedValue(null);
    mockDb.story.create.mockResolvedValue({ id: "story-null-user" });

    const job = {
      data: {
        userId: "non-existent-or-mock-id",
        rows: [
          {
            story: { title: "Story with mock user" },
            nodes: [],
          },
        ],
      },
    };

    await batchImportWorkerHandler(job);

    expect(mockDb.story.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        title: "Story with mock user",
        poster_id: null,
      }),
    });
  });

  it("should attach genres and author_ids to story, skipping non-existent ones", async () => {
    const validGenreId1 = "genre-uuid-1";
    const validGenreId2 = "genre-uuid-2";
    const validAuthorId1 = "11111111-1111-4111-8111-111111111111";

    mockDb.user.findUnique.mockResolvedValue(null);
    mockDb.story.findUnique.mockResolvedValue(null);
    mockDb.story.create.mockResolvedValue({ id: "story-uuid-genres" });

    // Mock genre queries: Action & Comedy exist, NonExistent does not
    mockDb.genre.findFirst.mockImplementation(async ({ where }) => {
      const name = where.name.equals.toLowerCase();
      if (name === "action") return { id: validGenreId1, name: "Action" };
      if (name === "comedy") return { id: validGenreId2, name: "Comedy" };
      return null;
    });

    // Mock author queries: validAuthorId1 exists, others do not
    mockDb.author.findUnique.mockImplementation(async ({ where }) => {
      if (where.id === validAuthorId1) return { id: validAuthorId1, name: "Oda Eiichiro" };
      return null;
    });

    mockDb.story_Genre.createMany.mockResolvedValue({ count: 2 });
    mockDb.story_Author.createMany.mockResolvedValue({ count: 1 });

    const job = {
      data: {
        rows: [
          {
            story: {
              title: "Story with Genres and Authors",
              genres: ["Action", "NonExistentGenre", "Comedy"],
              author_ids: [
                validAuthorId1,
                "99999999-9999-4999-8999-999999999999", // non-existent UUID
                "not-a-valid-uuid", // invalid UUID format
              ],
            },
            nodes: [],
          },
        ],
      },
    };

    await batchImportWorkerHandler(job);

    // Verify genres
    expect(mockDb.genre.findFirst).toHaveBeenCalledTimes(3);
    expect(mockDb.story_Genre.createMany).toHaveBeenCalledWith({
      data: [
        { story_id: "story-uuid-genres", genre_id: validGenreId1 },
        { story_id: "story-uuid-genres", genre_id: validGenreId2 },
      ],
      skipDuplicates: true,
    });

    // Verify authors: invalid UUID format is skipped without querying DB, valid UUID queried
    expect(mockDb.author.findUnique).toHaveBeenCalledTimes(2);
    expect(mockDb.story_Author.createMany).toHaveBeenCalledWith({
      data: [{ story_id: "story-uuid-genres", author_id: validAuthorId1 }],
      skipDuplicates: true,
    });
  });

  it("should not call story_Genre.createMany or story_Author.createMany if no valid genres or authors exist", async () => {
    mockDb.user.findUnique.mockResolvedValue(null);
    mockDb.story.findUnique.mockResolvedValue(null);
    mockDb.story.create.mockResolvedValue({ id: "story-uuid-empty-rel" });

    mockDb.genre.findFirst.mockResolvedValue(null);
    mockDb.author.findUnique.mockResolvedValue(null);

    const job = {
      data: {
        rows: [
          {
            story: {
              title: "Story with Invalid Genres and Authors",
              genres: ["UnknownGenre"],
              author_ids: ["not-a-valid-uuid"],
            },
            nodes: [],
          },
        ],
      },
    };

    await batchImportWorkerHandler(job);

    expect(mockDb.story_Genre.createMany).not.toHaveBeenCalled();
    expect(mockDb.story_Author.createMany).not.toHaveBeenCalled();
  });
});
