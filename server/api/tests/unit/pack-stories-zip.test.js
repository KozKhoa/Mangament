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
  readStoryInfoJson,
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

    it("should parse 'Chương 10' properly as chapter", () => {
      const parsed = parseNodeFolderName("Chương 10");
      expect(parsed.isValid).toBe(true);
      expect(parsed.type).toBe("chapter");
      expect(parsed.orderIndex).toBe(10);
      expect(parsed.title).toBe("Chapter 10");
    });

    it("should parse 'Chuong 1' and 'Chuong_05' properly as chapter", () => {
      const p1 = parseNodeFolderName("Chuong 1");
      expect(p1.isValid).toBe(true);
      expect(p1.type).toBe("chapter");
      expect(p1.orderIndex).toBe(1);
      expect(p1.title).toBe("Chapter 1");

      const p2 = parseNodeFolderName("Chuong_05");
      expect(p2.isValid).toBe(true);
      expect(p2.type).toBe("chapter");
      expect(p2.orderIndex).toBe(5);
      expect(p2.title).toBe("Chapter 5");
    });

    it("should parse standalone folder names 'chapter', 'Chương', 'Chuong' as Chapter 1", () => {
      for (const name of ["chapter", "Chương", "Chuong", "chap"]) {
        const parsed = parseNodeFolderName(name);
        expect(parsed.isValid).toBe(true);
        expect(parsed.type).toBe("chapter");
        expect(parsed.orderIndex).toBe(1);
        expect(parsed.title).toBe("Chapter 1");
      }
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
        "title,other_titles,story_type,story_status,nation,nation_id,poster_id,author,genres,summary,cover_art_path,story_node_title,story_node_type,story_node_order_index,story_node_content_order_index,story_node_content_image_path",
      );
      expect(lines.length).toBe(3); // 1 header + 2 images

      expect(lines[1]).toContain("Naruto,,manga,ongoing,,,,,,,Naruto/cover.jpg,Chapter 1,chapter,1,1,Naruto/chapter 01/001.jpg");
      expect(lines[2]).toContain("Naruto,,manga,ongoing,,,,,,,Naruto/cover.jpg,Chapter 1,chapter,1,2,Naruto/chapter 01/002.jpg");
    });

    it("should include metadata from info.json in generated CSV", () => {
      const storiesData = [
        {
          dirName: "Sample_Dir",
          storyTitle: "Sample JSON Structure",
          coverArtFile: "cover_art.jpg",
          info: {
            title: "Sample JSON Structure",
            summary: "This is a sample JSON structure for demonstration purposes.",
            genres: ["example", "sample", "json"],
            authors: ["uuid-1", "uuid-2"],
            other_titles: ["Alternate Title 1", "Alternate Title 2"],
            nation: "Example Nation",
            nation_id: "uuid-nation",
            poster_id: "uuid-poster",
            type: "manga",
            status: "ongoing",
          },
          nodes: [
            {
              title: "Chapter 1",
              type: "chapter",
              orderIndex: 1,
              folderName: "chapter 01",
              imageFiles: ["001.jpg"],
            },
          ],
        },
      ];

      const csv = buildCsvContent(storiesData);
      const lines = csv.split("\n");

      expect(lines[1]).toContain("Sample JSON Structure");
      expect(lines[1]).toContain('"Alternate Title 1, Alternate Title 2"');
      expect(lines[1]).toContain("Example Nation");
      expect(lines[1]).toContain("uuid-nation");
      expect(lines[1]).toContain("uuid-poster");
      expect(lines[1]).toContain('"uuid-1, uuid-2"');
      expect(lines[1]).toContain('"example, sample, json"');
      expect(lines[1]).toContain("This is a sample JSON structure for demonstration purposes.");
      expect(lines[1]).toContain("Sample_Dir/cover_art.jpg");
      expect(lines[1]).toContain("Sample_Dir/chapter 01/001.jpg");
    });
  });

  describe("readStoryInfoJson", () => {
    let tempRoot;

    beforeEach(async () => {
      tempRoot = await fs.promises.mkdtemp(path.join(os.tmpdir(), "info-json-test-"));
    });

    afterEach(async () => {
      if (tempRoot && fs.existsSync(tempRoot)) {
        await fs.promises.rm(tempRoot, { recursive: true, force: true });
      }
    });

    it("should return null if info.json does not exist", async () => {
      const info = await readStoryInfoJson(tempRoot);
      expect(info).toBeNull();
    });

    it("should parse full info.json format accurately", async () => {
      const mockInfo = {
        title: "Sample JSON Structure",
        description: "This is a sample JSON structure for demonstration purposes.",
        genres: ["example", "sample", "json"],
        author: ["uuid-1", "uuid-2"],
        other_titles: ["Alternate Title 1", "Alternate Title 2"],
        nation: "Example Nation",
        nation_id: "uuid-nation",
        poster_id: "uuid-poster",
      };

      await fs.promises.writeFile(path.join(tempRoot, "info.json"), JSON.stringify(mockInfo, null, 2), "utf-8");

      const info = await readStoryInfoJson(tempRoot);
      expect(info).not.toBeNull();
      expect(info.title).toBe("Sample JSON Structure");
      expect(info.summary).toBe("This is a sample JSON structure for demonstration purposes.");
      expect(info.genres).toEqual(["example", "sample", "json"]);
      expect(info.authors).toEqual(["uuid-1", "uuid-2"]);
      expect(info.other_titles).toEqual(["Alternate Title 1", "Alternate Title 2"]);
      expect(info.nation).toBe("Example Nation");
      expect(info.nation_id).toBe("uuid-nation");
      expect(info.poster_id).toBe("uuid-poster");
      expect(info.type).toBe("manga");
      expect(info.status).toBe("ongoing");
    });

    it("should parse alternative field names in info.json (e.g. summary, comma-separated genres/authors)", async () => {
      const mockInfo = {
        title: "Alternate Story",
        summary: "Short summary text",
        genres: "Action, Comedy, Drama",
        authors: "Author A, Author B",
        other_title: "Title B",
        nation: "Japan",
        type: "light_novel",
        status: "finished",
      };

      await fs.promises.writeFile(path.join(tempRoot, "info.json"), JSON.stringify(mockInfo, null, 2), "utf-8");

      const info = await readStoryInfoJson(tempRoot);
      expect(info).not.toBeNull();
      expect(info.title).toBe("Alternate Story");
      expect(info.summary).toBe("Short summary text");
      expect(info.genres).toEqual(["Action", "Comedy", "Drama"]);
      expect(info.authors).toEqual(["Author A", "Author B"]);
      expect(info.other_titles).toEqual(["Title B"]);
      expect(info.type).toBe("light_novel");
      expect(info.status).toBe("finished");
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
