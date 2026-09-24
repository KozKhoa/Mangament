import { describe, it, expect, vi } from "vitest";
import * as XLSX from "xlsx";
import { parseStoriesSpreadsheet, generateStoryImportTemplate } from "../../src/utils/spreadsheet.parser.js";

vi.mock("../../configs/redis.js", () => ({
  redis: {
    options: { host: "127.0.0.1", port: 6379 },
    on: vi.fn(),
  },
}));

vi.mock("bullmq", () => ({
  Queue: vi.fn().mockImplementation(function () {
    return { add: vi.fn() };
  }),
  Worker: vi.fn().mockImplementation(function () {
    return { on: vi.fn(), close: vi.fn() };
  }),
}));

describe("Spreadsheet Parser", () => {
  const headers28 = [
    "title",
    "other_title",
    "story_type",
    "story_status",
    "nation_id",
    "nation",
    "deleted_status",
    "is_actived",
    "summary",
    "cover_art_id",
    // Level 1 StoryNode
    "story_node_title",
    "story_node_type",
    "story_node_order_index",
    "deleted_status",
    "story_node_content_order_index",
    "story_node_content_type",
    "story_node_content_content",
    "story_node_content_image_id",
    "story_node_content_deleted_status",
    // Level 2 StoryNode
    "story_node_title",
    "story_node_type",
    "story_node_order_index",
    "deleted_status",
    "story_node_content_order_index",
    "story_node_content_type",
    "story_node_content_content",
    "story_node_content_image_id",
    "story_node_content_deleted_status",
  ];

  function createTestSpreadsheetBuffer(rows, bookType = "xlsx") {
    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.aoa_to_sheet([headers28, ...rows]);
    XLSX.utils.book_append_sheet(wb, ws, "Sheet1");
    return XLSX.write(wb, { type: "buffer", bookType });
  }

  it("should parse an XLSX buffer with 28 columns properly", () => {
    const validUuid1 = "11111111-1111-4111-8111-111111111111";
    const validUuid2 = "22222222-2222-4222-8222-222222222222";
    const validUuid3 = "33333333-3333-4333-8333-333333333333";

    const row = [
      "Solo Leveling", // title
      "Tôi Thăng Cấp Một Mình, I Alone Level Up", // other_title
      "manga", // story_type
      "finished", // story_status
      validUuid1, // nation_id
      "Korea", // nation
      "not_deleted", // deleted_status
      "true", // is_actived
      "Sung Jin-woo rises from weak to strong", // summary
      validUuid2, // cover_art_id
      // Level 1 Node
      "Season 1", // story_node_title
      "volume", // story_node_type
      "1", // story_node_order_index
      "not_deleted", // deleted_status
      "1", // story_node_content_order_index
      "text", // story_node_content_type
      "Volume 1 Intro Text", // story_node_content_content
      "", // story_node_content_image_id
      "not_deleted", // story_node_content_deleted_status
      // Level 2 Node
      "Chapter 1", // story_node_title
      "chapter", // story_node_type
      "1", // story_node_order_index
      "not_deleted", // deleted_status
      "1", // story_node_content_order_index
      "image", // story_node_content_type
      "", // story_node_content_content
      validUuid3, // story_node_content_image_id
      "not_deleted", // story_node_content_deleted_status
    ];

    const buffer = createTestSpreadsheetBuffer([row], "xlsx");
    const result = parseStoriesSpreadsheet(buffer);

    expect(result).toHaveLength(1);

    const first = result[0];
    // Verify Story
    expect(first.story.title).toBe("Solo Leveling");
    expect(first.story.other_titles).toEqual(["Tôi Thăng Cấp Một Mình", "I Alone Level Up"]);
    expect(first.story.type).toBe("manga");
    expect(first.story.status).toBe("finished");
    expect(first.story.nation_id).toBe(validUuid1);
    expect(first.story.nation).toBe("Korea");
    expect(first.story.is_actived).toBe(true);
    expect(first.story.cover_art_id).toBe(validUuid2);

    // Verify Node 1 (Parent Node)
    expect(first.parentNode).toBeDefined();
    expect(first.parentNode.title).toBe("Season 1");
    expect(first.parentNode.type).toBe("volume");
    expect(first.parentNode.order_index).toBe(1);
    expect(first.parentNode.content).toBeDefined();
    expect(first.parentNode.content.content).toBe("Volume 1 Intro Text");
    expect(first.parentNode.content.type).toBe("text");
    expect(first.parentNode.content.image_id).toBeNull();

    // Verify Node 2 (Child Node)
    expect(first.childNode).toBeDefined();
    expect(first.childNode.title).toBe("Chapter 1");
    expect(first.childNode.type).toBe("chapter");
    expect(first.childNode.order_index).toBe(1);
    expect(first.childNode.content).toBeDefined();
    expect(first.childNode.content.type).toBe("image");
    expect(first.childNode.content.image_id).toBe(validUuid3);
  });

  it("should parse CSV buffer properly", () => {
    const row = [
      "One Piece",
      "Vua Hải Tặc",
      "manga",
      "ongoing",
      "", // nation_id empty
      "Japan", // nation
      "not_deleted",
      "1",
      "Hành trình tìm kho báu One Piece",
      "", // cover_art_id empty
      // Node 1
      "Arc Romance Dawn",
      "arc",
      "1",
      "not_deleted",
      "",
      "",
      "",
      "",
      "",
      // Node 2
      "Chapter 1",
      "chapter",
      "1",
      "not_deleted",
      "1",
      "text",
      "Romance Dawn chapter 1 content",
      "",
      "not_deleted",
    ];

    const buffer = createTestSpreadsheetBuffer([row], "csv");
    const result = parseStoriesSpreadsheet(buffer);

    expect(result).toHaveLength(1);
    expect(result[0].story.title).toBe("One Piece");
    expect(result[0].story.nation_id).toBeNull();
    expect(result[0].story.nation).toBe("Japan");
    expect(result[0].parentNode.title).toBe("Arc Romance Dawn");
    expect(result[0].parentNode.type).toBe("arc");
    expect(result[0].parentNode.content).toBeNull();
    expect(result[0].childNode.title).toBe("Chapter 1");
    expect(result[0].childNode.content.content).toBe("Romance Dawn chapter 1 content");
  });

  it("should ignore invalid UUIDs and set them to null", () => {
    const row = [
      "Test Story",
      "",
      "manga",
      "ongoing",
      "invalid-uuid-nation",
      "Japan",
      "not_deleted",
      "true",
      "",
      "invalid-cover-art-id",
      "Vol 1",
      "volume",
      "1",
      "not_deleted",
      "1",
      "image",
      "",
      "invalid-image-uuid",
      "not_deleted",
      "", // no node 2
      "",
      "",
      "",
      "",
      "",
      "",
      "",
      "",
    ];

    const buffer = createTestSpreadsheetBuffer([row], "xlsx");
    const result = parseStoriesSpreadsheet(buffer);

    expect(result[0].story.nation_id).toBeNull();
    expect(result[0].story.cover_art_id).toBeNull();
    expect(result[0].parentNode.content.image_id).toBeNull();
    expect(result[0].childNode).toBeNull();
  });

  it("should support story-only import without any story node columns", () => {
    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.aoa_to_sheet([
      ["title", "story_type", "story_status", "summary"],
      ["Standalone Story", "manga", "ongoing", "A story without any chapters yet"],
    ]);
    XLSX.utils.book_append_sheet(wb, ws, "Sheet1");
    const buffer = XLSX.write(wb, { type: "buffer", bookType: "xlsx" });

    const result = parseStoriesSpreadsheet(buffer);
    expect(result).toHaveLength(1);
    expect(result[0].story.title).toBe("Standalone Story");
    expect(result[0].story.summary).toBe("A story without any chapters yet");
    expect(result[0].nodes).toHaveLength(0);
    expect(result[0].parentNode).toBeNull();
    expect(result[0].childNode).toBeNull();
  });

  it("should support story nodes without any content", () => {
    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.aoa_to_sheet([
      ["title", "story_node_title", "story_node_type", "story_node_order_index"],
      ["Story With Empty Node", "Chapter 1", "chapter", 1],
    ]);
    XLSX.utils.book_append_sheet(wb, ws, "Sheet1");
    const buffer = XLSX.write(wb, { type: "buffer", bookType: "xlsx" });

    const result = parseStoriesSpreadsheet(buffer);
    expect(result).toHaveLength(1);
    expect(result[0].nodes).toHaveLength(1);
    expect(result[0].parentNode.title).toBe("Chapter 1");
    expect(result[0].parentNode.content).toBeNull();
  });

  it("should support story with only title and omitted columns", () => {
    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.aoa_to_sheet([
      ["title", "story_node_title"],
      ["Minimal Story", "Chapter 10"],
    ]);
    XLSX.utils.book_append_sheet(wb, ws, "Sheet1");
    const buffer = XLSX.write(wb, { type: "buffer", bookType: "xlsx" });

    const result = parseStoriesSpreadsheet(buffer);
    expect(result).toHaveLength(1);
    expect(result[0].story.title).toBe("Minimal Story");
    expect(result[0].story.summary).toBeNull();
    expect(result[0].story.cover_art_id).toBeNull();
    expect(result[0].story.nation_id).toBeNull();
    expect(result[0].parentNode.title).toBe("Chapter 10");
  });

  it("should parse 3-level story nodes with repeated headers", () => {
    const wb = XLSX.utils.book_new();
    const headers = [
      "title",
      // Level 1
      "story_node_title",
      "story_node_type",
      "story_node_order_index",
      // Level 2
      "story_node_title",
      "story_node_type",
      "story_node_order_index",
      // Level 3
      "story_node_title",
      "story_node_type",
      "story_node_order_index",
      "story_node_content_content",
    ];
    const row = [
      "Three Level Story",
      // L1
      "Volume 1",
      "volume",
      1,
      // L2
      "Chapter 1",
      "chapter",
      1,
      // L3
      "Part 1",
      "chapter",
      1,
      "Content of Part 1",
    ];
    const ws = XLSX.utils.aoa_to_sheet([headers, row]);
    XLSX.utils.book_append_sheet(wb, ws, "Sheet1");
    const buffer = XLSX.write(wb, { type: "buffer", bookType: "xlsx" });

    const result = parseStoriesSpreadsheet(buffer);
    expect(result).toHaveLength(1);
    expect(result[0].nodes).toHaveLength(3);
    expect(result[0].nodes[0].title).toBe("Volume 1");
    expect(result[0].nodes[0].type).toBe("volume");
    expect(result[0].nodes[1].title).toBe("Chapter 1");
    expect(result[0].nodes[1].type).toBe("chapter");
    expect(result[0].nodes[2].title).toBe("Part 1");
    expect(result[0].nodes[2].content.content).toBe("Content of Part 1");
    expect(result[0].parentNode.title).toBe("Volume 1");
    expect(result[0].childNode.title).toBe("Chapter 1");
  });

  it("should support numbered node headers (node_1_title, node_2_title, node_3_title)", () => {
    const wb = XLSX.utils.book_new();
    const headers = [
      "title",
      "node_1_title",
      "node_1_type",
      "node_1_order_index",
      "node_2_title",
      "node_2_type",
      "node_2_order_index",
      "node_3_title",
      "node_3_type",
      "node_3_order_index",
    ];
    const row = ["Numbered Story", "Arc 1", "arc", 1, "Vol 1", "volume", 1, "Chap 1", "chapter", 1];
    const ws = XLSX.utils.aoa_to_sheet([headers, row]);
    XLSX.utils.book_append_sheet(wb, ws, "Sheet1");
    const buffer = XLSX.write(wb, { type: "buffer", bookType: "xlsx" });

    const result = parseStoriesSpreadsheet(buffer);
    expect(result).toHaveLength(1);
    expect(result[0].nodes).toHaveLength(3);
    expect(result[0].nodes[0].title).toBe("Arc 1");
    expect(result[0].nodes[1].title).toBe("Vol 1");
    expect(result[0].nodes[2].title).toBe("Chap 1");
  });

  it("should support reordered columns in arbitrary sequence", () => {
    const wb = XLSX.utils.book_new();
    // Headers in completely shuffled order
    const headers = ["summary", "story_node_title", "nation", "title", "story_type"];
    const row = ["Shuffled summary description", "Shuffled Chapter", "Vietnam", "Shuffled Story", "novel"];
    const ws = XLSX.utils.aoa_to_sheet([headers, row]);
    XLSX.utils.book_append_sheet(wb, ws, "Sheet1");
    const buffer = XLSX.write(wb, { type: "buffer", bookType: "xlsx" });

    const result = parseStoriesSpreadsheet(buffer);
    expect(result).toHaveLength(1);
    expect(result[0].story.title).toBe("Shuffled Story");
    expect(result[0].story.summary).toBe("Shuffled summary description");
    expect(result[0].story.nation).toBe("Vietnam");
    expect(result[0].story.type).toBe("light_novel");
    expect(result[0].nodes[0].title).toBe("Shuffled Chapter");
  });

  it("should parse genres and author_ids correctly from columns", () => {
    const wb = XLSX.utils.book_new();
    const headers = ["title", "genres", "author_ids"];
    const row = ["One Piece", "Action, Detective, Romance", "11111111-1111-4111-8111-111111111111,22222222-2222-4222-8222-222222222222"];
    const ws = XLSX.utils.aoa_to_sheet([headers, row]);
    XLSX.utils.book_append_sheet(wb, ws, "Sheet1");
    const buffer = XLSX.write(wb, { type: "buffer", bookType: "xlsx" });

    const result = parseStoriesSpreadsheet(buffer);
    expect(result).toHaveLength(1);
    expect(result[0].story.title).toBe("One Piece");
    expect(result[0].story.genres).toEqual(["Action", "Detective", "Romance"]);
    expect(result[0].story.author_ids).toEqual(["11111111-1111-4111-8111-111111111111", "22222222-2222-4222-8222-222222222222"]);
  });

  it("should support story_genres and story_author_ids aliases", () => {
    const csvContent = `title,story_genres,story_author_ids\nNaruto,"Ninja;Adventure","33333333-3333-4333-8333-333333333333"`;
    const result = parseStoriesSpreadsheet(Buffer.from(csvContent));
    expect(result).toHaveLength(1);
    expect(result[0].story.genres).toEqual(["Ninja", "Adventure"]);
    expect(result[0].story.author_ids).toEqual(["33333333-3333-4333-8333-333333333333"]);
  });

  it("should throw an error for empty buffer or empty spreadsheet", () => {
    expect(() => parseStoriesSpreadsheet(Buffer.from(""))).toThrow(/File tải lên rỗng/);
  });

  describe("generateStoryImportTemplate", () => {
    it("should generate full xlsx template that can be parsed back properly", () => {
      const { buffer, mimeType, fileName } = generateStoryImportTemplate("full", "xlsx");
      expect(fileName).toBe("story_template_full.xlsx");
      expect(mimeType).toContain("spreadsheetml");
      expect(buffer).toBeInstanceOf(Buffer);

      // Verify that the generated template is parseable by parseStoriesSpreadsheet
      const parsed = parseStoriesSpreadsheet(buffer);
      expect(parsed).toHaveLength(1);
      expect(parsed[0].story.title).toBe("Solo Leveling");
      expect(parsed[0].nodes).toHaveLength(2);
      expect(parsed[0].nodes[0].title).toBe("Season 1");
      expect(parsed[0].nodes[1].title).toBe("Chapter 1");
    });

    it("should generate story_only csv template", () => {
      const { buffer, mimeType, fileName } = generateStoryImportTemplate("story_only", "csv");
      expect(fileName).toBe("story_template_story_only.csv");
      expect(mimeType).toContain("text/csv");
      expect(buffer).toBeInstanceOf(Buffer);

      const parsed = parseStoriesSpreadsheet(buffer);
      expect(parsed).toHaveLength(1);
      expect(parsed[0].story.title).toBe("One Piece");
      expect(parsed[0].nodes).toHaveLength(0);
    });

    it("should generate chapters_only xlsx template", () => {
      const { buffer, mimeType, fileName } = generateStoryImportTemplate("chapters_only", "xlsx");
      expect(fileName).toBe("story_template_chapters_only.xlsx");
      expect(mimeType).toContain("spreadsheetml");

      const parsed = parseStoriesSpreadsheet(buffer);
      expect(parsed).toHaveLength(1);
      expect(parsed[0].story.title).toBe("One Piece");
      expect(parsed[0].nodes).toHaveLength(1);
      expect(parsed[0].nodes[0].title).toBe("Chapter 1110");
    });

    it("should handle getStoryImportTemplate controller response with headers and buffer", async () => {
      const { getStoryImportTemplate } = await import("../../src/controllers/admin/story.controller.js");
      const req = { query: { format: "csv", type: "story_only" } };
      const headers = {};
      const res = {
        setHeader: (k, v) => {
          headers[k] = v;
        },
        send: (val) => val,
      };
      const next = () => {};

      await getStoryImportTemplate(req, res, next);
      expect(headers["Content-Type"]).toBe("text/csv; charset=utf-8");
      expect(headers["Content-Disposition"]).toBe('attachment; filename="story_template_story_only.csv"');
    });

    it("should parse cover_art_path and story_node_content_image_path correctly", () => {
      const csv = `title,cover_art_path,story_node_title,story_node_type,story_node_order_index,story_node_content_order_index,story_node_content_image_path
Naruto,images/covers/naruto.jpg,Chapter 1,chapter,1,1,images/chapters/ch1/01.png`;

      const parsed = parseStoriesSpreadsheet(Buffer.from(csv, "utf-8"));
      expect(parsed).toHaveLength(1);
      expect(parsed[0].story.title).toBe("Naruto");
      expect(parsed[0].story.cover_art_path).toBe("images/covers/naruto.jpg");
      expect(parsed[0].nodes).toHaveLength(1);
      expect(parsed[0].nodes[0].title).toBe("Chapter 1");
      expect(parsed[0].nodes[0].content).toBeDefined();
      expect(parsed[0].nodes[0].content.type).toBe("image");
      expect(parsed[0].nodes[0].content.image_path).toBe("images/chapters/ch1/01.png");
    });
  });
});
