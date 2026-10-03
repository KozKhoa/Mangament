#!/usr/bin/env node

import fs from "node:fs";
import path from "node:path";
import { PDFDocument, PDFName, PDFString } from "pdf-lib";
import sharp from "sharp";

// Supported image extensions
export const SUPPORTED_IMAGE_EXTS = new Set([
  ".jpg",
  ".jpeg",
  ".png",
  ".webp",
  ".avif",
  ".gif",
  ".bmp",
  ".tiff"
]);

/**
 * Natural Sort Comparison for Chapter and Image Filenames
 * (e.g. "chapter 2" < "chapter 10", "001.jpg" < "002.jpg")
 */
function naturalCompare(a, b) {
  return a.localeCompare(b, undefined, { numeric: true, sensitivity: "base" });
}

/**
 * Sanitize filename for OS safety
 */
function sanitizeFileName(name) {
  return name.replace(/[/\\?%*:|"<>]/g, "_").trim();
}

/**
 * CLI argument parser
 */
export function parseCliArgs(argv = process.argv.slice(2)) {
  const options = {
    sourceDir: "/run/media/khoa/6FF9-2D8B/Manga",
    outputDir: null, // Default to user's Downloads or source parent
    storyFilter: null,
    limit: 0, // 0 = all stories
    chapterLimit: null,
    dryRun: false,
  };

  for (let i = 0; i < argv.length; i++) {
    const arg = argv[i];
    if (arg === "--dir" || arg === "-d") {
      options.sourceDir = argv[++i];
    } else if (arg === "--output" || arg === "-o") {
      options.outputDir = path.resolve(argv[++i]);
    } else if (arg === "--story" || arg === "-s") {
      options.storyFilter = argv[++i];
    } else if (arg === "--limit" || arg === "-l") {
      options.limit = parseInt(argv[++i], 10);
    } else if (arg === "--chapters" || arg === "-c") {
      options.chapterLimit = parseInt(argv[++i], 10);
    } else if (arg === "--dry-run") {
      options.dryRun = true;
    } else if (arg === "--help" || arg === "-h") {
      printHelp();
      process.exit(0);
    }
  }

  return options;
}

function printHelp() {
  console.log(`
================================================================================
 📄 MANGAMENT - SCRIPT NÉN STORY THÀNH FILE PDF (KÈM MỤC LỤC TỰ ĐỘNG)
================================================================================
Cú pháp:
  node pack-stories-pdf/index.js [tùy chọn]

Tùy chọn:
  --dir, -d <path>         Đường dẫn thư mục gốc chứa các truyện
  --output, -o <path>      Thư mục xuất file PDF (Mặc định: Thư mục Downloads)
  --story, -s <name>       Lọc theo tên truyện cụ thể
  --limit, -l <num>        Giới hạn số lượng truyện xử lý (0 = tất cả)
  --chapters, -c <num>     Giới hạn số chapter tối đa cho mỗi truyện
  --dry-run                Chạy thử quét thư mục và thống kê trang (không tạo PDF)
  --help, -h               Hiển thị trợ giúp này

Tính năng Mục Lục Tự Động (PDF Bookmarks/Outlines):
  Tự động xây dựng cây mục lục bookmark theo đúng cấu trúc thư mục của truyện
  (Volume 01 -> Chapter 01 -> Trang ảnh) giúp người đọc dễ dàng nhảy tới tập/chương.
================================================================================
`);
}

/**
 * Low-level PDF Outline / Bookmark Generator matching story folder hierarchy
 */
export function createPdfOutlines(pdfDoc, pageRefs, treeNodes) {
  if (!treeNodes || treeNodes.length === 0) return;

  const context = pdfDoc.context;
  const outlinesDictRef = context.nextRef();

  function processNodeList(nodes, parentRef) {
    if (!nodes || nodes.length === 0) return null;

    const itemRefs = nodes.map(() => context.nextRef());

    for (let i = 0; i < nodes.length; i++) {
      const node = nodes[i];
      const itemRef = itemRefs[i];

      const childrenInfo = processNodeList(node.children, itemRef);
      const targetPageRef = pageRefs[node.pageIndex] || pageRefs[0];

      const outlineItemObj = {
        Title: PDFString.of(node.title),
        Parent: parentRef,
        Dest: [targetPageRef, PDFName.of("XYZ"), null, null, null],
      };

      if (i > 0) outlineItemObj.Prev = itemRefs[i - 1];
      if (i < nodes.length - 1) outlineItemObj.Next = itemRefs[i + 1];

      if (childrenInfo) {
        outlineItemObj.First = childrenInfo.firstRef;
        outlineItemObj.Last = childrenInfo.lastRef;
        outlineItemObj.Count = childrenInfo.count;
      }

      const outlineItem = context.obj(outlineItemObj);
      context.assign(itemRef, outlineItem);
    }

    return {
      firstRef: itemRefs[0],
      lastRef: itemRefs[itemRefs.length - 1],
      count: nodes.length,
    };
  }

  const topLevelInfo = processNodeList(treeNodes, outlinesDictRef);

  if (topLevelInfo) {
    const outlinesDict = context.obj({
      Type: PDFName.of("Outlines"),
      First: topLevelInfo.firstRef,
      Last: topLevelInfo.lastRef,
      Count: topLevelInfo.count,
    });

    context.assign(outlinesDictRef, outlinesDict);
    pdfDoc.catalog.set(PDFName.of("Outlines"), outlinesDictRef);
  }
}

/**
 * Recursively walk storyDir and build a tree of folders + collect flat images list.
 */
export async function collectStoryTreeAndImages(dirPath) {
  const flatImages = [];

  async function walk(currentDir) {
    const entries = await fs.promises.readdir(currentDir, { withFileTypes: true });
    entries.sort((a, b) => naturalCompare(a.name, b.name));

    const directFiles = [];
    const subdirs = [];

    for (const entry of entries) {
      if (entry.isDirectory() && !entry.name.startsWith(".")) {
        subdirs.push(path.join(currentDir, entry.name));
      } else if (entry.isFile()) {
        const ext = path.extname(entry.name).toLowerCase();
        if (SUPPORTED_IMAGE_EXTS.has(ext)) {
          directFiles.push(path.join(currentDir, entry.name));
        }
      }
    }

    const childrenNodes = [];

    if (directFiles.length > 0) {
      for (const f of directFiles) {
        flatImages.push(f);
      }
    }

    for (const subDir of subdirs) {
      const startPageIndex = flatImages.length;
      const subChildren = await walk(subDir);
      const endPageIndex = flatImages.length;

      if (endPageIndex > startPageIndex) {
        childrenNodes.push({
          title: path.basename(subDir),
          pageIndex: startPageIndex,
          children: subChildren,
        });
      }
    }

    return childrenNodes;
  }

  const treeNodes = await walk(dirPath);
  return { flatImages, treeNodes };
}

/**
 * Check if a directory is a single story folder
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
 * Scan top-level story folders in sourceDir
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
  let storyFolders = entries.filter((e) => e.isDirectory() && !e.name.startsWith(".")).map((e) => e.name);

  storyFolders.sort(naturalCompare);

  if (options.storyFilter) {
    const filterLower = options.storyFilter.toLowerCase();
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
 * Generate a single PDF file for a single story with Outlines (Bookmarks)
 */
export async function packSingleStoryToPdf({ storyName, storyDir, outputPath, chapterLimit = null, onProgress = () => {} }) {
  const { flatImages, treeNodes } = await collectStoryTreeAndImages(storyDir);

  if (flatImages.length === 0) {
    return { storyName, pageCount: 0, skipped: true, reason: "Không tìm thấy ảnh nào trong thư mục" };
  }

  onProgress({ task: `Đang tạo PDF cho truyện "${storyName}"...`, percent: 0 });

  const pdfDoc = await PDFDocument.create();
  const pageRefs = [];

  let processedCount = 0;
  for (let i = 0; i < flatImages.length; i++) {
    const imgPath = flatImages[i];
    try {
      const buffer = await fs.promises.readFile(imgPath);
      
      // Convert to clean JPEG stream using sharp for maximum compatibility and size optimization
      const { data, info } = await sharp(buffer)
        .jpeg({ quality: 88, mozjpeg: true })
        .toBuffer({ resolveWithObject: true });

      const embeddedImage = await pdfDoc.embedJpg(data);

      const page = pdfDoc.addPage([info.width, info.height]);
      pageRefs.push(page.ref);

      page.drawImage(embeddedImage, {
        x: 0,
        y: 0,
        width: info.width,
        height: info.height,
      });

      processedCount++;
      const percent = (processedCount / flatImages.length) * 100;
      onProgress({
        task: `[${storyName}] Đã nhúng ${processedCount}/${flatImages.length} trang...`,
        percent,
      });
    } catch (err) {
      console.warn(`[Cảnh báo] Lỗi khi nhúng ảnh ${imgPath}: ${err.message}`);
    }
  }

  if (processedCount === 0) {
    throw new Error(`Không thể nhúng trang ảnh nào cho truyện: ${storyName}`);
  }

  // Create PDF Outlines / Bookmarks matching the folder hierarchy
  try {
    createPdfOutlines(pdfDoc, pageRefs, treeNodes);
  } catch (err) {
    console.warn(`[Cảnh báo] Lỗi khi tạo mục lục bookmark: ${err.message}`);
  }

  const pdfBytes = await pdfDoc.save();
  
  // Ensure destination folder exists
  const destDir = path.dirname(outputPath);
  await fs.promises.mkdir(destDir, { recursive: true });
  
  await fs.promises.writeFile(outputPath, pdfBytes);
  const stat = await fs.promises.stat(outputPath);

  return {
    storyName,
    pageCount: processedCount,
    outputPath,
    fileSize: stat.size,
    bookmarkCount: treeNodes.length,
  };
}

/**
 * Main coordinator function for PDF Packer
 */
export async function main(overrideOptions = null, logger = console.log, onProgress = () => {}) {
  const startTime = Date.now();
  const options = overrideOptions ? { ...parseCliArgs([]), ...overrideOptions } : parseCliArgs();

  const defaultOut = options.outputDir || path.join(process.cwd(), "pdf_exports");
  options.outputDir = defaultOut;

  logger("\n================================================================================");
  logger(" 📄 MANGAMENT - ĐÓNG GÓI STORY THÀNH FILE PDF (KÈM MỤC LỤC TỰ ĐỘNG)");
  logger("================================================================================");
  logger(`📁 Thư mục nguồn:     ${options.sourceDir}`);
  logger(`💾 Thư mục PDF xuất:  ${options.outputDir}`);
  logger(`🎯 Giới hạn truyện:   ${options.limit > 0 ? options.limit : "Tất cả truyện"}`);
  if (options.storyFilter) logger(`🔍 Lọc theo tên:      "${options.storyFilter}"`);
  if (options.chapterLimit) logger(`📑 Giới hạn chapter:   ${options.chapterLimit} chapter/truyện`);
  logger(`⚙️  Chế độ:            ${options.dryRun ? "🔍 DRY-RUN (Mô phỏng thử)" : "⚡ TẠO FILE PDF"}`);
  logger("--------------------------------------------------------------------------------\n");

  onProgress({ task: "Đang quét các thư mục truyện...", percent: 0 });
  const storyFolderNames = await scanStoryFolders(options.sourceDir, options);

  if (storyFolderNames.length === 0) {
    logger("⚠️  Không tìm thấy truyện nào thỏa mãn điều kiện lọc!");
    return { success: false, message: "Không tìm thấy truyện nào thỏa mãn điều kiện lọc!" };
  }

  logger(`✅ Tìm thấy ${storyFolderNames.length} truyện cần xử lý.\n`);

  const results = [];
  let totalPagesProcessed = 0;

  for (let i = 0; i < storyFolderNames.length; i++) {
    const item = storyFolderNames[i];
    const name = typeof item === "string" ? item : item.name;
    const storyDir = typeof item === "string" ? path.join(options.sourceDir, name) : item.storyDir;
    const pdfFileName = `${sanitizeFileName(name)}.pdf`;
    const pdfOutputPath = path.join(options.outputDir, pdfFileName);

    const overallProgress = (i / storyFolderNames.length) * 100;
    onProgress({ task: `Đang xử lý truyện [${i + 1}/${storyFolderNames.length}]: ${name}`, percent: overallProgress });

    if (options.dryRun) {
      const { flatImages, treeNodes } = await collectStoryTreeAndImages(storyDir);
      logger(`🔍 [DRY-RUN] Truyện [${name}]: ${flatImages.length} trang ảnh ➔ ${pdfFileName} (có mục lục ${treeNodes.length} mục)`);
      results.push({ storyName: name, pageCount: flatImages.length, outputPath: pdfOutputPath, dryRun: true });
      totalPagesProcessed += flatImages.length;
      continue;
    }

    logger(`🚀 Đang đóng gói PDF cho: ${name}...`);
    try {
      const res = await packSingleStoryToPdf({
        storyName: name,
        storyDir,
        outputPath: pdfOutputPath,
        chapterLimit: options.chapterLimit,
        onProgress: (subProg) => {
          const currentStoryPercent = overallProgress + (subProg.percent / storyFolderNames.length);
          onProgress({ task: subProg.task, percent: currentStoryPercent });
        },
      });

      if (!res.skipped) {
        const sizeMb = (res.fileSize / (1024 * 1024)).toFixed(2);
        logger(`  ✅ [Thành công] ${name} ➔ ${res.outputPath} (${res.pageCount} trang, ${sizeMb} MB) [Đã tạo Mục Lục Bookmarks]`);
        totalPagesProcessed += res.pageCount;
        results.push(res);
      } else {
        logger(`  ⚠️  [Bỏ qua] ${name}: ${res.reason}`);
      }
    } catch (err) {
      logger(`  ❌ [Thất bại] ${name}: ${err.message}`);
    }
  }

  onProgress({ task: "Hoàn tất tạo tất cả PDF!", percent: 100 });

  const durationSec = ((Date.now() - startTime) / 1000).toFixed(2);

  logger("\n================================================================================");
  logger(" 🎉 HOÀN TẤT TIẾN TRÌNH TẠO PDF (KÈM MỤC LỤC THƯ MỤC)!");
  logger("================================================================================");
  logger(`📁 Thư mục lưu PDF:  ${options.outputDir}`);
  logger(`⏱️  Thời gian xử lý:  ${durationSec} giây`);
  logger(`📚 Thống kê:         ${results.length}/${storyFolderNames.length} truyện xuất thành công | ${totalPagesProcessed} tổng trang`);
  logger("================================================================================\n");

  return {
    success: true,
    totalStories: results.length,
    totalPages: totalPagesProcessed,
    outputDir: options.outputDir,
    results,
  };
}

// Support CLI execution directly
if (process.argv[1] && process.argv[1].endsWith("pack-stories-pdf/index.js")) {
  main().catch((err) => {
    console.error("❌ Lỗi thực thi:", err);
    process.exit(1);
  });
}
