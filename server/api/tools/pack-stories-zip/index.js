#!/usr/bin/env node

/**
 * Script quét cấu trúc thư mục truyện tranh và đóng gói thành file ZIP kèm file stories.csv
 * phục vụ cho tính năng Batch Import của hệ thống Mangament.
 *
 * Cấu trúc thư mục nguồn được hỗ trợ:
 *   <source_dir>/
 *     ├── <Tên Truyện>/
 *     │     ├── cover_art.jpg (ảnh bìa tùy chọn)
 *     │     ├── chapter 01/
 *     │     │     ├── 000.jpg
 *     │     │     ├── 001.jpg
 *     │     │     └── ...
 *     │     ├── chapter 02/
 *     │     │     └── ...
 *     │     └── volume 1/
 *     └── ...
 *
 * Cấu trúc bên trong file ZIP được sinh ra:
 *   archive.zip
 *   ├── stories.csv
 *   └── <Tên Truyện>/
 *       ├── cover_art.jpg
 *       └── chapter 01/
 *           ├── 000.jpg
 *           └── 001.jpg
 *
 * Cách chạy:
 *   node index.js [options]
 */

import fs from "node:fs";
import path from "node:path";
import crypto from "node:crypto";
import { spawn } from "node:child_process";

// Danh sách định dạng ảnh được hỗ trợ
export const SUPPORTED_IMAGE_EXTS = new Set([".jpg", ".jpeg", ".png", ".webp", ".avif"]);

/**
 * Phân tích tham số dòng lệnh (CLI Arguments)
 */
export function parseCliArgs(argv = process.argv.slice(2)) {
  const options = {
    sourceDir: "/run/media/khoa/6FF9-2D8B/Manga",
    outputPath: null, // Mặc định tự động sinh dựa trên tên truyện hoặc manga_batch.zip
    storyFilter: null,
    limit: 0, // 0 = tất cả
    chapterLimit: null,
    compressionLevel: 1, // 0 = store (nhanh nhất cho ảnh), 1 = fast, 6 = default
    dryRun: false,
    csvOnly: false,
    keepTemp: false,
  };

  for (let i = 0; i < argv.length; i++) {
    const arg = argv[i];
    if (arg === "--dir" || arg === "-d") {
      options.sourceDir = argv[++i];
    } else if (arg === "--output" || arg === "-o") {
      options.outputPath = path.resolve(argv[++i]);
    } else if (arg === "--story" || arg === "-s") {
      options.storyFilter = argv[++i];
    } else if (arg === "--limit" || arg === "-l") {
      options.limit = parseInt(argv[++i], 10);
    } else if (arg === "--chapters" || arg === "-c") {
      options.chapterLimit = parseInt(argv[++i], 10);
    } else if (arg === "--compression") {
      options.compressionLevel = Math.max(0, Math.min(9, parseInt(argv[++i], 10) || 1));
    } else if (arg === "--fast") {
      options.compressionLevel = 1;
    } else if (arg === "--store") {
      options.compressionLevel = 0;
    } else if (arg === "--dry-run") {
      options.dryRun = true;
    } else if (arg === "--csv-only") {
      options.csvOnly = true;
    } else if (arg === "--keep-temp") {
      options.keepTemp = true;
    } else if (arg === "--help" || arg === "-h") {
      printHelp();
      process.exit(0);
    }
  }

  // Nếu chưa chỉ định outputPath, đặt mặc định
  if (!options.outputPath) {
    if (options.storyFilter && !options.storyFilter.includes("*")) {
      const safeName = options.storyFilter.replace(/[/\\?%*:|"<>]/g, "_").trim();
      options.outputPath = path.resolve(process.cwd(), `${safeName}.zip`);
    } else {
      options.outputPath = path.resolve(process.cwd(), "manga_batch.zip");
    }
  }

  return options;
}

export function printHelp() {
  console.log(`
================================================================================
 📦 MANGAMENT - SCRIPT ĐÓNG GÓI BATCH IMPORT ZIP CHO TRUYỆN TRANH
================================================================================
Cú pháp:
  node index.js [tùy chọn]

Tùy chọn:
  --dir, -d <path>         Đường dẫn thư mục gốc chứa truyện
                           (Mặc định: /run/media/khoa/6FF9-2D8B/Manga)
  --output, -o <path>      Đường dẫn file .zip xuất ra (mặc định: ./manga_batch.zip)
  --story, -s <name>       Lọc theo tên truyện cụ thể (ví dụ: "Chainsaw Man")
  --limit, -l <num>        Giới hạn số lượng truyện quét (0 = tất cả)
  --chapters, -c <num>     Giới hạn số chapter tối đa cho mỗi truyện (ví dụ: 2)
  --compression <0-9>      Mức độ nén của zip (0 = store, 1 = nhanh, 6 = chuẩn; mặc định: 1)
  --store                  Nén mức 0 (không nén, tốc độ ghi đĩa tối đa cho ảnh JPG/PNG)
  --fast                   Nén mức 1 (nhanh)
  --dry-run                Chạy thử quét thư mục và xem trước CSV (không tạo file zip)
  --csv-only               Chỉ tạo file stories.csv mà không đóng gói file zip
  --keep-temp              Giữ lại thư mục staging tạm thời sau khi nén
  --help, -h               Hiển thị trợ giúp này

Ví dụ:
  # Chạy thử mô phỏng xem trước dữ liệu CSV:
  node index.js --dry-run

  # Đóng gói 1 truyện duy nhất với 2 chapter để test tải lên server:
  node index.js --story "Genshin Impact" --chapters 2 -o genshin_test.zip

  # Đóng gói nhanh toàn bộ thư mục với mức nén store (tốc độ cao):
  node index.js -d "/path/to/Manga" --store -o full_manga.zip
================================================================================
`);
}

/**
 * Phân tích tên thư mục node: <story_node_type> <story_node_order_index>
 * Quy ước mọi tiền tố chapter, chap, ch, chương, chuong,... về kiểu "chapter" và title "Chapter X"
 */
export function parseNodeFolderName(folderName) {
  const trimmed = folderName.trim();

  // Pattern 1: <type> <order> (ví dụ: "chapter 01", "Volume 2", "chương 10", "Chuong 1", "Chương_02", "Chap-3", "c1")
  const m = trimmed.match(/^(chapter|chap|ch|c|chương|chuong|volume|vol|tập|tap|arc|hồi|hoi)[\s_.:-]*([0-9]+(?:\.[0-9]+)?)/i);
  if (m) {
    const rawType = m[1].toLowerCase();
    let type = "chapter";
    if (["volume", "vol", "tập", "tap"].includes(rawType)) {
      type = "volume";
    } else if (["arc", "hồi", "hoi"].includes(rawType)) {
      type = "arc";
    }

    const orderIndex = parseFloat(m[2]);
    const cleanOrder = Number.isNaN(orderIndex) ? 1 : orderIndex;
    const typeLabel = type.charAt(0).toUpperCase() + type.slice(1);
    return {
      isValid: true,
      type,
      orderIndex: cleanOrder,
      title: `${typeLabel} ${cleanOrder}`,
      folderName: trimmed,
    };
  }

  // Pattern 2: Chỉ là tên type đơn thuần không có số (ví dụ: "chapter", "Chương", "Chuong", "chap")
  const bareTypeM = trimmed.match(/^(chapter|chap|ch|chương|chuong|volume|vol|tập|tap|arc|hồi|hoi)$/i);
  if (bareTypeM) {
    const rawType = bareTypeM[1].toLowerCase();
    let type = "chapter";
    if (["volume", "vol", "tập", "tap"].includes(rawType)) {
      type = "volume";
    } else if (["arc", "hồi", "hoi"].includes(rawType)) {
      type = "arc";
    }

    const typeLabel = type.charAt(0).toUpperCase() + type.slice(1);
    return {
      isValid: true,
      type,
      orderIndex: 1,
      title: `${typeLabel} 1`,
      folderName: trimmed,
    };
  }

  // Pattern 3: Chỉ là số (ví dụ: "01", "1", "10", "1.5")
  const numM = trimmed.match(/^([0-9]+(?:\.[0-9]+)?)$/);
  if (numM) {
    const orderIndex = parseFloat(numM[1]);
    const cleanOrder = Number.isNaN(orderIndex) ? 1 : orderIndex;
    return {
      isValid: true,
      type: "chapter",
      orderIndex: cleanOrder,
      title: `Chapter ${cleanOrder}`,
      folderName: trimmed,
    };
  }

  return {
    isValid: false,
    type: "chapter",
    orderIndex: null,
    title: trimmed,
    folderName: trimmed,
  };
}

/**
 * Escape chuỗi an toàn cho CSV cell (Giao thức RFC 4180)
 */
export function escapeCsvCell(val) {
  if (val === null || val === undefined) return "";
  const str = String(val);
  if (str.includes(",") || str.includes('"') || str.includes("\n") || str.includes("\r")) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
}

/**
 * Kiểm tra xem một thư mục có phải là một truyện duy nhất hay không
 */
export async function isSingleStoryDir(sourceDir) {
  if (!fs.existsSync(sourceDir)) return false;

  const entries = await fs.promises.readdir(sourceDir, { withFileTypes: true });

  for (const entry of entries) {
    if (entry.isFile()) {
      const ext = path.extname(entry.name).toLowerCase();
      if (entry.name === "info.json" || SUPPORTED_IMAGE_EXTS.has(ext)) {
        return true;
      }
    }
  }

  const subdirs = entries.filter((e) => e.isDirectory() && !e.name.startsWith("."));
  if (subdirs.length === 0) return true;

  for (const subdir of subdirs.slice(0, 5)) {
    const subPath = path.join(sourceDir, subdir.name);
    try {
      const subEntries = await fs.promises.readdir(subPath, { withFileTypes: true });
      const hasDirectImages = subEntries.some(
        (e) => e.isFile() && SUPPORTED_IMAGE_EXTS.has(path.extname(e.name).toLowerCase())
      );
      if (hasDirectImages) {
        return true;
      }
    } catch {
      // ignore
    }
  }

  return false;
}

/**
 * Quét danh sách truyện trong thư mục nguồn
 */
export async function scanStoryFolders(sourceDir, options = {}) {
  if (!fs.existsSync(sourceDir)) {
    throw new Error(`Thư mục nguồn không tồn tại: ${sourceDir}`);
  }

  const packMode = options.packMode || "auto";
  const isSingle = packMode === "single" || (packMode === "auto" && await isSingleStoryDir(sourceDir));

  if (isSingle) {
    return [
      {
        name: path.basename(sourceDir),
        isSingleStory: true,
        storyDir: sourceDir,
      },
    ];
  }

  const entries = await fs.promises.readdir(sourceDir, { withFileTypes: true });
  let storyFolders = entries
    .filter((e) => e.isDirectory() && !e.name.startsWith("."))
    .map((e) => e.name)
    .sort((a, b) => a.localeCompare(b, "vi", { sensitivity: "base" }));

  if (options.storyFilter) {
    const filterLower = options.storyFilter.toLowerCase().trim();
    storyFolders = storyFolders.filter((name) => name.toLowerCase().includes(filterLower));
  }

  if (options.limit && options.limit > 0) {
    storyFolders = storyFolders.slice(0, options.limit);
  }

  return storyFolders.map((name) => ({
    name,
    isSingleStory: false,
    storyDir: path.join(sourceDir, name),
  }));
}

/**
 * Đọc file info.json trong thư mục truyện nếu có
 *
 * @param {string} storyDir - Đường dẫn thư mục truyện
 * @returns {Promise<Object|null>}
 */
export async function readStoryInfoJson(storyDir) {
  const infoPath = path.join(storyDir, "info.json");
  if (!fs.existsSync(infoPath)) {
    return null;
  }

  try {
    const rawContent = await fs.promises.readFile(infoPath, "utf-8");
    const data = JSON.parse(rawContent);
    if (!data || typeof data !== "object") return null;

    // 1. Title
    const title = data.title && typeof data.title === "string" ? data.title.trim() : "";

    // 2. Summary / Description
    const summary = data.description || data.summary || "";

    // 3. Genres (mảng các string hoặc chuỗi phân tách bởi dấu phẩy)
    let genres = [];
    const rawGenres = data.genres || data.genre;
    if (Array.isArray(rawGenres)) {
      genres = rawGenres.map((g) => String(g).trim()).filter(Boolean);
    } else if (typeof rawGenres === "string") {
      genres = rawGenres
        .split(/[,;\n|]+/)
        .map((g) => g.trim())
        .filter(Boolean);
    }

    // 4. Authors / Author (mảng các string/uuid hoặc chuỗi phân tách bởi dấu phẩy)
    let authors = [];
    const rawAuthors = data.author || data.authors || data.author_ids || data.authorIds;
    if (Array.isArray(rawAuthors)) {
      authors = rawAuthors.map((a) => String(a).trim()).filter(Boolean);
    } else if (typeof rawAuthors === "string") {
      authors = rawAuthors
        .split(/[,;\n|]+/)
        .map((a) => a.trim())
        .filter(Boolean);
    }

    // 5. Other titles
    let otherTitles = [];
    const rawOtherTitles = data.other_titles || data.other_title || data.otherTitles;
    if (Array.isArray(rawOtherTitles)) {
      otherTitles = rawOtherTitles.map((t) => String(t).trim()).filter(Boolean);
    } else if (typeof rawOtherTitles === "string") {
      otherTitles = rawOtherTitles
        .split(/[,;\n|]+/)
        .map((t) => t.trim())
        .filter(Boolean);
    }

    // 6. Nation & Nation ID
    const nation = data.nation && typeof data.nation === "string" ? data.nation.trim() : "";
    const nationId = data.nation_id || data.nationId || "";

    // 7. Poster ID
    const posterId = data.poster_id || data.posterId || "";

    // 8. Story Type & Status
    const type = data.type || data.story_type || "manga";
    const status = data.status || data.story_status || "ongoing";

    return {
      title,
      summary,
      description: summary,
      genres,
      authors,
      author: authors,
      other_titles: otherTitles,
      otherTitles,
      nation,
      nation_id: nationId,
      poster_id: posterId,
      type,
      status,
      raw: data,
    };
  } catch (err) {
    console.warn(`[Warning] Không thể đọc hoặc parse file info.json tại ${infoPath}: ${err.message}`);
    return null;
  }
}

/**
 * Quét đệ quy các thư mục con để tìm cây phân cấp node (Volume, Arc, Chapter...) và file ảnh trang
 */
export async function scanDirectoryNodes(currentDir, relPathFromStoryDir = "", parentChain = []) {
  const items = await fs.promises.readdir(currentDir, { withFileTypes: true });

  const allImages = items
    .filter((f) => f.isFile() && SUPPORTED_IMAGE_EXTS.has(path.extname(f.name).toLowerCase()))
    .map((f) => f.name)
    .sort((a, b) => a.localeCompare(b, undefined, { numeric: true, sensitivity: "base" }));

  // Lọc bỏ file ảnh bìa nếu đang ở root thư mục truyện
  const pageImageFiles =
    relPathFromStoryDir === ""
      ? allImages.filter((f) => !/^(cover_art|cover|poster)\.(jpe?g|png|webp|avif)$/i.test(f))
      : allImages;

  const subdirs = items
    .filter((f) => f.isDirectory() && !f.name.startsWith("."))
    .map((f) => f.name)
    .sort((a, b) => a.localeCompare(b, "vi", { numeric: true, sensitivity: "base" }));

  // Nếu thư mục này có chứa các trang ảnh -> Đây là 1 leaf node (chứa ảnh)
  if (pageImageFiles.length > 0) {
    const lastChainItem = parentChain.length > 0 ? parentChain[parentChain.length - 1] : null;
    const effectiveChain =
      parentChain.length > 0
        ? parentChain
        : [
            {
              type: "chapter",
              orderIndex: 1,
              title: "Chapter 1",
              folderName: relPathFromStoryDir,
            },
          ];

    return [
      {
        nodeChain: effectiveChain,
        title: lastChainItem ? lastChainItem.title : "Chapter 1",
        type: lastChainItem ? lastChainItem.type : "chapter",
        orderIndex: lastChainItem ? lastChainItem.orderIndex : 1,
        folderName: relPathFromStoryDir,
        nodePath: currentDir,
        imageFiles: pageImageFiles,
      },
    ];
  }

  // Nếu không có ảnh nhưng có thư mục con -> quét tiếp các thư mục con
  const leafNodes = [];
  for (const subDirName of subdirs) {
    const subDirPath = path.join(currentDir, subDirName);
    const subRelPath = relPathFromStoryDir ? `${relPathFromStoryDir}/${subDirName}` : subDirName;

    const parsed = parseNodeFolderName(subDirName);
    let nextParentChain = parentChain;

    if (parsed.isValid) {
      const nodeInfo = {
        type: parsed.type,
        orderIndex: parsed.orderIndex ?? (leafNodes.length + 1),
        title: parsed.title,
        folderName: subDirName,
      };
      nextParentChain = [...parentChain, nodeInfo];
    }

    const subLeafNodes = await scanDirectoryNodes(subDirPath, subRelPath, nextParentChain);
    leafNodes.push(...subLeafNodes);
  }

  return leafNodes;
}

/**
 * Quét chi tiết nội dung của 1 truyện
 */
export async function inspectStory(storyDir, options = {}) {
  const items = await fs.promises.readdir(storyDir, { withFileTypes: true });

  // 1. Đọc file info.json nếu có
  const info = await readStoryInfoJson(storyDir);
  const infoFile = fs.existsSync(path.join(storyDir, "info.json")) ? "info.json" : null;

  // 2. Tìm ảnh bìa cover art nếu có
  let coverArtFile = null;
  const coverFiles = items.filter((i) => i.isFile() && /^(cover_art|cover|poster)\.(jpe?g|png|webp|avif)$/i.test(i.name));
  if (coverFiles.length > 0) {
    coverArtFile = coverFiles[0].name;
  } else if (info?.raw?.cover_art && typeof info.raw.cover_art === "string") {
    if (fs.existsSync(path.join(storyDir, info.raw.cover_art))) {
      coverArtFile = info.raw.cover_art;
    }
  }

  // 3. Quét cây node đệ quy
  const leafNodes = await scanDirectoryNodes(storyDir, "", []);

  // Sắp xếp các leaf node theo thứ tự cây phân cấp
  leafNodes.sort((a, b) => {
    const chainA = a.nodeChain || [];
    const chainB = b.nodeChain || [];
    const minLen = Math.min(chainA.length, chainB.length);
    for (let i = 0; i < minLen; i++) {
      const orderA = chainA[i].orderIndex ?? 0;
      const orderB = chainB[i].orderIndex ?? 0;
      if (orderA !== orderB) {
        return orderA - orderB;
      }
    }
    return chainA.length - chainB.length;
  });

  // Giới hạn số chapter nếu được yêu cầu
  const selectedNodes = options.chapterLimit && options.chapterLimit > 0 ? leafNodes.slice(0, options.chapterLimit) : leafNodes;

  return {
    coverArtFile,
    nodes: selectedNodes,
    info,
    infoFile,
  };
}

/**
 * Xây dựng nội dung file stories.csv chuẩn format batch import
 */
export function buildCsvContent(storiesData) {
  // Tìm độ sâu node lớn nhất giữa các truyện
  let maxNodeDepth = 1;
  for (const story of storiesData) {
    for (const node of story.nodes || []) {
      const chainLen = node.nodeChain?.length || 1;
      if (chainLen > maxNodeDepth) {
        maxNodeDepth = chainLen;
      }
    }
  }

  // Header cơ bản cho Story
  const headers = [
    "title",
    "other_titles",
    "story_type",
    "story_status",
    "nation",
    "nation_id",
    "poster_id",
    "author",
    "genres",
    "summary",
    "cover_art_path",
  ];

  // Thêm các cột node theo cấp (Level 1..K)
  for (let lvl = 0; lvl < maxNodeDepth; lvl++) {
    headers.push("story_node_title", "story_node_type", "story_node_order_index");
  }

  // Thêm cột nội dung (gắn ở cấp node cuối)
  headers.push("story_node_content_order_index", "story_node_content_image_path");

  const rows = [headers.join(",")];

  for (const story of storiesData) {
    const dirPrefix = story.dirName || story.storyTitle;
    const coverArtRelPath = story.coverArtFile ? `${dirPrefix}/${story.coverArtFile}` : "";

    const storyTitle = story.info?.title || story.storyTitle;
    const otherTitles = story.info?.other_titles?.length ? story.info.other_titles.join(", ") : "";
    const storyType = story.info?.type || "manga";
    const storyStatus = story.info?.status || "ongoing";
    const nation = story.info?.nation || "";
    const nationId = story.info?.nation_id || "";
    const posterId = story.info?.poster_id || "";
    const authors = story.info?.authors?.length ? story.info.authors.join(", ") : "";
    const genres = story.info?.genres?.length ? story.info.genres.join(", ") : "";
    const summary = story.info?.summary || "";

    const storyFields = [
      escapeCsvCell(storyTitle),
      escapeCsvCell(otherTitles),
      escapeCsvCell(storyType),
      escapeCsvCell(storyStatus),
      escapeCsvCell(nation),
      escapeCsvCell(nationId),
      escapeCsvCell(posterId),
      escapeCsvCell(authors),
      escapeCsvCell(genres),
      escapeCsvCell(summary),
      escapeCsvCell(coverArtRelPath),
    ];

    if (!story.nodes || story.nodes.length === 0) {
      // Truyện không có node nào
      const emptyCols = new Array(maxNodeDepth * 3 + 2).fill("");
      rows.push([...storyFields, ...emptyCols].join(","));
      continue;
    }

    for (const node of story.nodes) {
      const chain =
        node.nodeChain && node.nodeChain.length > 0
          ? node.nodeChain
          : [
              {
                title: node.title || "Chapter 1",
                type: node.type || "chapter",
                orderIndex: node.orderIndex ?? 1,
                folderName: node.folderName || "",
              },
            ];

      // Căn lề chuỗi node về phía bên phải cấp maxNodeDepth
      const shift = maxNodeDepth - chain.length;
      const nodeLevelCols = [];

      for (let lvl = 0; lvl < maxNodeDepth; lvl++) {
        const chainIdx = lvl - shift;
        if (chainIdx >= 0 && chainIdx < chain.length) {
          const item = chain[chainIdx];
          nodeLevelCols.push(
            escapeCsvCell(item.title),
            escapeCsvCell(item.type),
            escapeCsvCell(item.orderIndex),
          );
        } else {
          nodeLevelCols.push("", "", "");
        }
      }

      if (!node.imageFiles || node.imageFiles.length === 0) {
        rows.push([...storyFields, ...nodeLevelCols, "", ""].join(","));
        continue;
      }

      // Mỗi trang ảnh là 1 dòng
      for (let i = 0; i < node.imageFiles.length; i++) {
        const imgName = node.imageFiles[i];
        const imgRelPath = `${dirPrefix}/${node.folderName}/${imgName}`;

        const contentCols = [
          escapeCsvCell(i + 1),
          escapeCsvCell(imgRelPath),
        ];
        rows.push([...storyFields, ...nodeLevelCols, ...contentCols].join(","));
      }
    }
  }

  return rows.join("\n");
}

/**
 * Đóng gói dữ liệu thành file ZIP qua lệnh zip hệ thống với symlinks
 */
export async function packStoriesToZip({ storiesData, csvContent, outputPath, compressionLevel = 1, keepTemp = false, onProgress = () => {} }) {
  const stagingId = `pack_stage_${Date.now()}_${crypto.randomUUID().slice(0, 6)}`;
  const stagingDir = path.resolve(process.cwd(), `temp_${stagingId}`);

  await fs.promises.mkdir(stagingDir, { recursive: true });

  try {
    let totalFilesToZip = 1; // stories.csv
    onProgress({ task: "Đang tạo liên kết (symlinks)...", percent: 0 });

    const csvPath = path.join(stagingDir, "stories.csv");
    await fs.promises.writeFile(csvPath, csvContent, "utf-8");

    let processedFolders = 0;
    for (const story of storiesData) {
      const folderNameInStage = story.dirName || story.storyTitle;
      const storyStageDir = path.join(stagingDir, folderNameInStage);
      await fs.promises.mkdir(storyStageDir, { recursive: true });

      if (story.coverArtFile && story.coverArtAbsPath) {
        totalFilesToZip++;
        const destCover = path.join(storyStageDir, story.coverArtFile);
        try {
          await fs.promises.symlink(story.coverArtAbsPath, destCover);
        } catch {
          await fs.promises.copyFile(story.coverArtAbsPath, destCover);
        }
      }

      if (story.infoFile && story.storyDir) {
        const srcInfo = path.join(story.storyDir, story.infoFile);
        const destInfo = path.join(storyStageDir, story.infoFile);
        if (fs.existsSync(srcInfo)) {
          totalFilesToZip++;
          try {
            await fs.promises.copyFile(srcInfo, destInfo);
          } catch {
            // ignore
          }
        }
      }

      for (const node of story.nodes) {
        const nodeStageDir = path.join(storyStageDir, node.folderName);
        await fs.promises.mkdir(nodeStageDir, { recursive: true });

        for (const imgName of node.imageFiles) {
          totalFilesToZip++;
          const srcImgPath = path.join(node.nodePath, imgName);
          const destImgPath = path.join(nodeStageDir, imgName);
          try {
            await fs.promises.symlink(srcImgPath, destImgPath);
          } catch {
            await fs.promises.copyFile(srcImgPath, destImgPath);
          }
        }
      }
      processedFolders++;
      onProgress({ task: "Đang tạo liên kết (symlinks)...", percent: (processedFolders / storiesData.length) * 30 });
    }

    const outputDir = path.dirname(outputPath);
    await fs.promises.mkdir(outputDir, { recursive: true });

    if (fs.existsSync(outputPath)) {
      await fs.promises.unlink(outputPath);
    }

    onProgress({ task: "Đang nén file ZIP...", percent: 30 });

    await new Promise((resolve, reject) => {
      // Bỏ flag -q để lệnh zip in ra danh sách file đã nén ("  adding: ...")
      const zipProcess = spawn("zip", ["-r", `-${compressionLevel}`, outputPath, "."], {
        cwd: stagingDir,
        stdio: ["ignore", "pipe", "pipe"],
      });

      let stderr = "";
      let zippedFilesCount = 0;

      zipProcess.stdout.on("data", (chunk) => {
        const str = chunk.toString();
        // Mỗi file nén sẽ in ra dạng "  adding: ..."
        const adds = (str.match(/adding:/g) || []).length;
        if (adds > 0) {
          zippedFilesCount += adds;
          let zipProgress = zippedFilesCount / totalFilesToZip;
          if (zipProgress > 1) zipProgress = 1;
          // Progress từ 30% -> 100%
          onProgress({ task: "Đang nén file ZIP...", percent: 30 + (zipProgress * 70) });
        }
      });

      zipProcess.stderr.on("data", (chunk) => {
        stderr += chunk.toString();
      });

      zipProcess.on("close", (code) => {
        if (code === 0) {
          onProgress({ task: "Hoàn tất nén ZIP!", percent: 100 });
          resolve();
        } else {
          reject(new Error(`Lệnh zip kết thúc với mã lỗi ${code}: ${stderr}`));
        }
      });

      zipProcess.on("error", (err) => {
        reject(err);
      });
    });

    const stat = await fs.promises.stat(outputPath);
    return {
      outputPath,
      fileSize: stat.size,
      stagingDir,
    };
  } finally {
    if (!keepTemp) {
      try {
        await fs.promises.rm(stagingDir, { recursive: true, force: true });
      } catch {
        // bỏ qua lỗi dọn dẹp
      }
    }
  }
}

/**
 * Hàm điều phối chính
 */
/**
 * Hàm điều phối chính
 */
export async function main(overrideOptions = null, logger = console.log, onProgress = () => {}) {
  const startTime = Date.now();
  const options = overrideOptions ? { ...parseCliArgs([]), ...overrideOptions } : parseCliArgs();

  logger("\n================================================================================");
  logger(" 📦 MANGAMENT - ĐÓNG GÓI BATCH IMPORT ZIP CHO TRUYỆN TRANH");
  logger("================================================================================");
  logger(`📁 Thư mục nguồn:     ${options.sourceDir}`);
  logger(`🎯 Giới hạn truyện:   ${options.limit > 0 ? options.limit : "Tất cả truyện tìm thấy"}`);
  if (options.storyFilter) logger(`🔍 Lọc theo tên:      "${options.storyFilter}"`);
  if (options.chapterLimit) logger(`📑 Giới hạn chapter:   ${options.chapterLimit} chapter/truyện`);
  logger(`🗜️  Mức độ nén ZIP:    Mức ${options.compressionLevel} (${options.compressionLevel === 0 ? "Store - Siêu tốc" : "Fast"})`);
  logger(`💾 File xuất ra:       ${options.outputPath}`);
  logger(`⚙️  Chế độ:            ${options.dryRun ? "🔍 DRY-RUN (Chỉ kiểm tra, không nén)" : options.csvOnly ? "📄 CSV-ONLY" : "⚡ TẠO FILE ZIP"}`);
  logger("--------------------------------------------------------------------------------\n");

  // 1. Quét danh sách truyện
  logger("⏳ Đang quét danh sách truyện...");
  const storyFolderNames = await scanStoryFolders(options.sourceDir, options);

  if (storyFolderNames.length === 0) {
    logger("⚠️  Không tìm thấy truyện nào thỏa mãn điều kiện lọc!");
    return { success: false, message: "Không tìm thấy truyện nào thỏa mãn điều kiện lọc!" };
  }

  if (storyFolderNames.length === 1 && (!options.outputPath || options.outputPath.endsWith("manga_batch.zip"))) {
    const singleName = typeof storyFolderNames[0] === "string" ? storyFolderNames[0] : storyFolderNames[0].name;
    const baseDir = options.outputPath ? path.dirname(options.outputPath) : process.cwd();
    options.outputPath = path.join(baseDir, `${sanitizeFileName(singleName)}.zip`);
  }

  logger(`✅ Tìm thấy ${storyFolderNames.length} truyện cần xử lý.\n`);

  // 2. Quét chi tiết các node và ảnh của từng truyện
  const storiesData = [];
  let totalNodes = 0;
  let totalImages = 0;

  for (const item of storyFolderNames) {
    const name = typeof item === "string" ? item : item.name;
    const storyDir = typeof item === "string" ? path.join(options.sourceDir, item) : item.storyDir;
    const inspected = await inspectStory(storyDir, options);

    const coverArtAbsPath = inspected.coverArtFile ? path.join(storyDir, inspected.coverArtFile) : null;
    const storyImageCount = inspected.nodes.reduce((acc, n) => acc + n.imageFiles.length, 0);

    const finalTitle = inspected.info?.title || name;

    storiesData.push({
      dirName: name,
      storyTitle: finalTitle,
      storyDir,
      coverArtFile: inspected.coverArtFile,
      coverArtAbsPath,
      info: inspected.info,
      infoFile: inspected.infoFile,
      nodes: inspected.nodes,
      imageCount: storyImageCount,
    });

    totalNodes += inspected.nodes.length;
    totalImages += storyImageCount;

    const titleDisplay = inspected.info?.title && inspected.info.title !== name ? ` (${inspected.info.title})` : "";
    logger(
      `  📖 [${name}]${titleDisplay} - ${inspected.coverArtFile ? "Có ảnh bìa" : "Không bìa"} | ${inspected.nodes.length} chapters | ${storyImageCount} ảnh`,
    );
  }

  logger("\n--------------------------------------------------------------------------------");
  logger(`📊 Tổng hợp: ${storiesData.length} truyện, ${totalNodes} chapters, ${totalImages} trang ảnh.`);
  logger("--------------------------------------------------------------------------------\n");

  // 3. Xây dựng nội dung file stories.csv
  logger("⏳ Đang sinh nội dung stories.csv...");
  const csvContent = buildCsvContent(storiesData);
  const csvLineCount = csvContent.split("\n").length;
  logger(`✅ Đã sinh nội dung CSV gồm ${csvLineCount} dòng (1 dòng tiêu đề + ${csvLineCount - 1} dòng dữ liệu).\n`);

  // Nếu là chế độ dry-run
  if (options.dryRun) {
    logger("🔍 [DRY-RUN] Xem trước 12 dòng đầu tiên của file stories.csv:");
    logger("================================================================================");
    const previewLines = csvContent.split("\n").slice(0, 12).join("\n");
    logger(previewLines);
    logger("================================================================================");
    logger("\n✨ Hoàn tất mô phỏng dry-run. Không có file nào được tạo.");
    return { success: true, dryRun: true, previewLines, totalStories: storiesData.length, totalNodes, totalImages };
  }

  // Nếu chỉ tạo file CSV
  if (options.csvOnly) {
    const csvOutputPath = options.outputPath.endsWith(".zip") ? options.outputPath.replace(/\.zip$/i, ".csv") : `${options.outputPath}.csv`;
    await fs.promises.writeFile(csvOutputPath, csvContent, "utf-8");
    logger(`✅ Đã lưu file CSV thành công: ${csvOutputPath}`);
    return { success: true, csvOnly: true, csvOutputPath, totalStories: storiesData.length, totalNodes, totalImages };
  }

  // 4. Tiến hành đóng gói ZIP
  logger(`🚀 Đang đóng gói file ZIP vào: ${options.outputPath}...`);
  const zipResult = await packStoriesToZip({
    storiesData,
    csvContent,
    outputPath: options.outputPath,
    compressionLevel: options.compressionLevel,
    keepTemp: options.keepTemp,
    onProgress,
  });

  const durationSec = ((Date.now() - startTime) / 1000).toFixed(2);
  const sizeMb = (zipResult.fileSize / (1024 * 1024)).toFixed(2);

  logger("\n================================================================================");
  logger(" 🎉 HOÀN TẤT ĐÓNG GÓI FILE ZIP THÀNH CÔNG!");
  logger("================================================================================");
  logger(`📦 Đường dẫn file ZIP:  ${zipResult.outputPath}`);
  logger(`💾 Dung lượng file:     ${sizeMb} MB (${zipResult.fileSize.toLocaleString()} bytes)`);
  logger(`⏱️  Thời gian xử lý:     ${durationSec} giây`);
  logger(`📚 Thống kê đóng gói:   ${storiesData.length} truyện | ${totalNodes} chapters | ${totalImages} ảnh`);
  logger("================================================================================\n");

  return {
    success: true,
    outputPath: zipResult.outputPath,
    fileSize: zipResult.fileSize,
    durationSec,
    totalStories: storiesData.length,
    totalNodes,
    totalImages,
  };
}

// Nếu script được thực thi trực tiếp từ CLI
if (process.argv[1] && process.argv[1].endsWith("pack-stories-zip/index.js")) {
  main().catch((err) => {
    console.error("\n❌ LỖI TRONG QUÁ TRÌNH ĐÓNG GÓI:");
    console.error("  ", err.message);
    process.exit(1);
  });
}

