import { describe, it, expect, beforeEach, afterEach } from "vitest";
import fs from "fs";
import path from "path";
import os from "os";
import { execFile } from "child_process";
import { promisify } from "util";
import {
  parseNodeFolderName,
  escapeCsvCell,
  parseCliArgs,
  scanStoryFolders,
  inspectStory,
  buildCsvContent,
  packStoriesToZip,
} from "../../scripts/pack-stories-zip/index.js";

const execFileAsync = promisify(execFile);

describe("Pack Stories ZIP Script", () => {
  describe("parseNodeFolderName", () => {
    it("should parse 'chapter 01' properly", () => {
      const parsed = parseNodeFolderName("chapter 01");
      expect(parsed.isValid).toBe(true);
      expect(parsed.type).toBe("chapter");
      expect(parsed.orderIndex).toBe(1);
      expect(parsed.title).toBe("Chapter 1");
    });

    it("should parse 'Volume 2' properly", () => {
      const parsed = parseNodeFolderName("Volume 2");
      expect(parsed.isValid).toBe(true);
      expect(parsed.type).toBe("volume");
      expect(parsed.orderIndex).toBe(2);
      expect(parsed.title).toBe("Volume 2");
    });

    it("should parse 'arc 3' properly", () => {
      const parsed = parseNodeFolderName("arc 3");
      expect(parsed.isValid).toBe(true);
      expect(parsed.type).toBe("arc");
      expect(parsed.orderIndex).toBe(3);
    });

    it("should parse pure numbers '05' as chapter 5", () => {
      const parsed = parseNodeFolderName("05");
      expect(parsed.isValid).toBe(true);
      expect(parsed.type).toBe("chapter");
      expect(parsed.orderIndex).toBe(5);
    });

    it("should mark invalid folder names", () => {
      const parsed = parseNodeFolderName("extra_folder");
      expect(parsed.isValid).toBe(false);
    });
  });

  describe("escapeCsvCell", () => {
    it("should return empty string for null or undefined", () => {
      expect(escapeCsvCell(null)).toBe("");
      expect(escapeCsvCell(undefined)).toBe("");
    });

    it("should return string as-is if no special characters", () => {
      expect(escapeCsvCell("Solo Leveling")).toBe("Solo Leveling");
    });

    it("should wrap in quotes and escape internal quotes if comma or quote present", () => {
      expect(escapeCsvCell('He said "Hello", world')).toBe('"He said ""Hello"", world"');
    });
  });

  describe("parseCliArgs", () => {
    it("should parse CLI options correctly", () => {
      const args = ["-d", "/custom/manga", "-s", "Naruto", "-c", "5", "--store", "-o", "/tmp/naruto.zip"];
      const opts = parseCliArgs(args);

      expect(opts.sourceDir).toBe("/custom/manga");
      expect(opts.storyFilter).toBe("Naruto");
      expect(opts.chapterLimit).toBe(5);
      expect(opts.compressionLevel).toBe(0);
      expect(opts.outputPath).toBe("/tmp/naruto.zip");
    });
  });

  describe("buildCsvContent", () => {
    it("should build valid CSV content with relative paths", () => {
      const storiesData = [
        {
          storyTitle: "Naruto",
          coverArtFile: "cover.jpg",
          nodes: [
            {
              title: "Chapter 1",
              type: "chapter",
              orderIndex: 1,
              folderName: "chapter 01",
              imageFiles: ["001.jpg", "002.jpg"],
            },
          ],
        },
      ];

      const csv = buildCsvContent(storiesData);
      const lines = csv.split("\n");

      expect(lines[0]).toBe(
        "title,story_type,story_status,nation,genres,summary,cover_art_path,story_node_title,story_node_type,story_node_order_index,story_node_content_order_index,story_node_content_image_path",
      );
      expect(lines.length).toBe(3); // 1 header + 2 images

      expect(lines[1]).toContain("Naruto,manga,ongoing,,,,Naruto/cover.jpg,Chapter 1,chapter,1,1,Naruto/chapter 01/001.jpg");
      expect(lines[2]).toContain("Naruto,manga,ongoing,,,,Naruto/cover.jpg,Chapter 1,chapter,1,2,Naruto/chapter 01/002.jpg");
    });
  });

  describe("End-to-end: Scanning & PackStoriesToZip", () => {
    let tempRoot;

    beforeEach(async () => {
      tempRoot = await fs.promises.mkdtemp(path.join(os.tmpdir(), "pack-zip-test-"));
    });

    afterEach(async () => {
      if (tempRoot && fs.existsSync(tempRoot)) {
        await fs.promises.rm(tempRoot, { recursive: true, force: true });
      }
    });

    it("should scan mock directory and pack into valid zip file", async () => {
      // Tạo cấu trúc thư mục mock truyện
      const storyName = "Test Manga";
      const storyDir = path.join(tempRoot, "source", storyName);
      const chap1Dir = path.join(storyDir, "chapter 01");
      const chap2Dir = path.join(storyDir, "chapter 02");

      await fs.promises.mkdir(chap1Dir, { recursive: true });
      await fs.promises.mkdir(chap2Dir, { recursive: true });

      // Tạo ảnh bìa và ảnh trang truyện
      await fs.promises.writeFile(path.join(storyDir, "cover_art.jpg"), "cover data");
      await fs.promises.writeFile(path.join(chap1Dir, "001.jpg"), "page 1 data");
      await fs.promises.writeFile(path.join(chap1Dir, "002.jpg"), "page 2 data");
      await fs.promises.writeFile(path.join(chap2Dir, "001.jpg"), "page 3 data");

      const sourceDir = path.join(tempRoot, "source");

      // 1. Quét danh sách truyện
      const storyFolders = await scanStoryFolders(sourceDir, { storyFilter: "Test" });
      expect(storyFolders).toEqual(["Test Manga"]);

      // 2. Quét nội dung chi tiết
      const inspected = await inspectStory(storyDir, { chapterLimit: 1 });
      expect(inspected.coverArtFile).toBe("cover_art.jpg");
      expect(inspected.nodes.length).toBe(1); // chapterLimit: 1
      expect(inspected.nodes[0].imageFiles).toEqual(["001.jpg", "002.jpg"]);

      const storiesData = [
        {
          storyTitle: storyName,
          storyDir,
          coverArtFile: inspected.coverArtFile,
          coverArtAbsPath: path.join(storyDir, inspected.coverArtFile),
          nodes: inspected.nodes,
        },
      ];

      // 3. Xây dựng CSV
      const csvContent = buildCsvContent(storiesData);
      expect(csvContent).toContain("Test Manga/cover_art.jpg");
      expect(csvContent).toContain("Test Manga/chapter 01/001.jpg");

      // 4. Đóng gói ZIP
      const outputZip = path.join(tempRoot, "output.zip");
      const result = await packStoriesToZip({
        storiesData,
        csvContent,
        outputPath: outputZip,
        compressionLevel: 0,
      });

      expect(fs.existsSync(result.outputPath)).toBe(true);
      expect(result.fileSize).toBeGreaterThan(0);

      // 5. Kiểm tra nội dung archive qua lệnh unzip -l
      const { stdout } = await execFileAsync("unzip", ["-l", outputZip]);
      expect(stdout).toContain("stories.csv");
      expect(stdout).toContain("Test Manga/cover_art.jpg");
      expect(stdout).toContain("Test Manga/chapter 01/001.jpg");
      expect(stdout).toContain("Test Manga/chapter 01/002.jpg");
      // chapter 2 đã bị loại bỏ vì chapterLimit = 1
      expect(stdout).not.toContain("chapter 02");
    });
  });
});
