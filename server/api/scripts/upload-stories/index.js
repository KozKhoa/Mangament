#!/usr/bin/env node

/**
 * Script upload truyện từ cấu trúc thư mục ổ đĩa vào Database (Story, StoryNode, StoryNodeContent, Image).
 *
 * Cấu trúc thư mục mục tiêu:
 *   <story_title>/
 *     ├── cover_art.jpg (tùy chọn)
 *     ├── <story_node_type> <story_node_order_index>/
 *     │     ├── 000.jpg
 *     │     ├── 001.jpg
 *     │     └── ...
 *     └── ...
 *
 * Cách chạy:
 *   node index.js [options]
 *
 * Tùy chọn:
 *   --dir, -d <path>         Đường dẫn thư mục chứa truyện (mặc định: /run/media/khoa/6FF9-2D8B/Manga)
 *   --limit, -l <num>        Số lượng truyện cần quét (mặc định: Tất cả; truyền số để giới hạn)
 *   --story, -s <name>       Tên truyện cụ thể cần quét (hỗ trợ tìm kiếm không phân biệt hoa thường)
 *   --chapters, -c <num>     Giới hạn số chương tối đa mỗi truyện (tùy chọn, hữu ích khi test)
 *   --dry-run                Chạy thử mô phỏng quét thư mục mà không ghi vào DB và không copy file
 *   --no-copy                Không copy file ảnh vào thư mục public của server
 *   --public-dir <path>      Đường dẫn thư mục public (mặc định: ../../public)
 *   --help, -h               Hiển thị hướng dẫn
 */

import fs from "fs";
import path from "path";
import crypto from "crypto";
import { fileURLToPath } from "url";
import dotenvFlow from "dotenv-flow";
import sharp from "sharp";
import { readStoryInfoJson } from "../pack-stories-zip/index.js";

export { readStoryInfoJson };

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Nạp file môi trường từ server/api
dotenvFlow.config({
  path: path.resolve(__dirname, "../.."),
  node_env: process.env.NODE_ENV || "development",
  silent: true,
});

// Import db Prisma từ server/api
let db = null;
async function getDb() {
  if (!db) {
    const dbModule = await import("../../configs/db.js");
    db = dbModule.default;
  }
  return db;
}

let syncStoryChildren = null;
async function getSyncStoryChildren() {
  if (!syncStoryChildren) {
    const storyService = await import("../../src/services/story.service.js");
    syncStoryChildren = storyService.SyncStoryChildren;
  }
  return syncStoryChildren;
}

// Danh sách đuôi file ảnh được hỗ trợ
const SUPPORTED_IMAGE_EXTS = new Set([".jpg", ".jpeg", ".png", ".webp", ".avif"]);

/**
 * Kiểm tra chuỗi có phải UUID hợp lệ không
 */
export function isUUID(str) {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(String(str));
}

/**
 * Tìm hoặc tạo bản ghi Nation từ ID hoặc tên quốc gia
 */
export async function resolveNation(prisma, nationId, nationName) {
  if (nationId && isUUID(nationId)) {
    const nation = await prisma.nation.findUnique({ where: { id: nationId } });
    if (nation) return nation.id;
  }
  if (nationName && typeof nationName === "string" && nationName.trim()) {
    const cleanName = nationName.trim();
    let nation = await prisma.nation.findFirst({
      where: { name: { equals: cleanName, mode: "insensitive" } },
    });
    if (!nation) {
      try {
        nation = await prisma.nation.create({
          data: { name: cleanName },
        });
      } catch {
        nation = await prisma.nation.findFirst({
          where: { name: { equals: cleanName, mode: "insensitive" } },
        });
      }
    }
    if (nation) return nation.id;
  }
  return null;
}

/**
 * Xác thực poster_id có tồn tại trong hệ thống User không
 */
export async function resolvePoster(prisma, posterId) {
  if (!posterId || !isUUID(posterId)) return null;
  const user = await prisma.user.findUnique({ where: { id: posterId } });
  return user ? user.id : null;
}

/**
 * Tìm hoặc tạo các Genre và trả về danh sách genre_id
 */
export async function resolveGenres(prisma, genresList) {
  if (!Array.isArray(genresList) || genresList.length === 0) return [];
  const genreIds = [];

  for (const rawGenre of genresList) {
    if (!rawGenre || typeof rawGenre !== "string") continue;
    const cleanName = rawGenre.trim();
    if (!cleanName) continue;

    let genre = await prisma.genre.findFirst({
      where: { name: { equals: cleanName, mode: "insensitive" } },
    });
    if (!genre) {
      try {
        genre = await prisma.genre.create({
          data: { name: cleanName },
        });
      } catch {
        genre = await prisma.genre.findFirst({
          where: { name: { equals: cleanName, mode: "insensitive" } },
        });
      }
    }
    if (genre && !genreIds.includes(genre.id)) {
      genreIds.push(genre.id);
    }
  }

  return genreIds;
}

/**
 * Tìm hoặc tạo các Author và trả về danh sách author_id
 */
export async function resolveAuthors(prisma, authorsList) {
  if (!Array.isArray(authorsList) || authorsList.length === 0) return [];
  const authorIds = [];

  for (const rawAuthor of authorsList) {
    if (!rawAuthor || typeof rawAuthor !== "string") continue;
    const cleanAuthor = rawAuthor.trim();
    if (!cleanAuthor) continue;

    if (isUUID(cleanAuthor)) {
      const author = await prisma.author.findUnique({ where: { id: cleanAuthor } });
      if (author && !authorIds.includes(author.id)) {
        authorIds.push(author.id);
      }
    } else {
      let author = await prisma.author.findFirst({
        where: { name: { equals: cleanAuthor, mode: "insensitive" } },
      });
      if (!author) {
        try {
          author = await prisma.author.create({
            data: { name: cleanAuthor },
          });
        } catch {
          author = await prisma.author.findFirst({
            where: { name: { equals: cleanAuthor, mode: "insensitive" } },
          });
        }
      }
      if (author && !authorIds.includes(author.id)) {
        authorIds.push(author.id);
      }
    }
  }

  return authorIds;
}

/**
 * Phân tích tham số dòng lệnh (CLI Arguments)
 */
function parseCliArgs() {
  const args = process.argv.slice(2);
  const options = {
    sourceDir: "/run/media/khoa/6FF9-2D8B/Manga",
    limit: 0, // Mặc định 0 = không giới hạn, quét lần lượt tất cả truyện
    storyFilter: null,
    chapterLimit: null,
    dryRun: false,
    copyFiles: true,
    publicDir: process.env.PUBLIC_DIR ? path.resolve(process.env.PUBLIC_DIR) : path.resolve(__dirname, "../../../public"),
  };

  for (let i = 0; i < args.length; i++) {
    const arg = args[i];
    if (arg === "--dir" || arg === "-d") {
      options.sourceDir = args[++i];
    } else if (arg === "--limit" || arg === "-l") {
      options.limit = parseInt(args[++i], 10);
    } else if (arg === "--story" || arg === "-s") {
      options.storyFilter = args[++i];
    } else if (arg === "--chapters" || arg === "-c") {
      options.chapterLimit = parseInt(args[++i], 10);
    } else if (arg === "--public-dir" || arg === "-p") {
      options.publicDir = path.resolve(args[++i]);
    } else if (arg === "--dry-run") {
      options.dryRun = true;
    } else if (arg === "--no-copy") {
      options.copyFiles = false;
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
 MANGAMENT - SCRIPT UPLOAD STORIES TỪ THƯ MỤC Ổ ĐĨA
================================================================================
Cú pháp:
  node index.js [tùy chọn]

Tùy chọn:
  --dir, -d <path>         Đường dẫn thư mục chứa truyện
                           (Mặc định: /run/media/khoa/6FF9-2D8B/Manga)
  --limit, -l <num>        Số lượng truyện quét (Mặc định: Tất cả; truyền số để giới hạn)
  --story, -s <name>       Tên truyện cụ thể cần quét (ví dụ: "Chainsaw Man")
  --chapters, -c <num>     Giới hạn số chương tối đa mỗi truyện (ví dụ: 2 để test)
  --public-dir, -p <path>  Thư mục public lưu trữ (ảnh sẽ lưu tại <public-dir>/images/stories)
                           (Có thể nằm ở ổ cứng khác; mặc định: biến PUBLIC_DIR hoặc server/public)
  --dry-run                Chạy thử quét và hiển thị thống kê (không ghi vào DB)
  --no-copy                Không sao chép file ảnh vào thư mục lưu trữ
  --help, -h               Hiển thị trang trợ giúp này

Ví dụ:
  # Chạy thử quét toàn bộ truyện (không ghi DB):
  node index.js --dry-run

  # Quét 1 truyện cụ thể, giới hạn 2 chapter đầu tiên:
  node index.js --story "Genshin Impact" --chapters 2

  # Quét và import thật tất cả truyện:
  node index.js
================================================================================
`);
}

/**
 * Chuẩn hóa tên mime-type từ phần mở rộng file
 */
function getMimeType(ext) {
  switch (ext.toLowerCase()) {
    case ".png":
      return "image/png";
    case ".webp":
      return "image/webp";
    case ".avif":
      return "image/avif";
    case ".jpg":
    case ".jpeg":
    default:
      return "image/jpeg";
  }
}

/**
 * Phân tích tên thư mục node: <story_node_type> <story_node_order_index>
 * Ví dụ:
 *   "chapter 01"  -> { isValid: true, type: "chapter", orderIndex: 1, title: "Chapter 1" }
 *   "chapter 00"  -> { isValid: true, type: "chapter", orderIndex: 0, title: "Chapter 0" }
 *   "volume 2"    -> { isValid: true, type: "volume", orderIndex: 2, title: "Volume 2" }
 *   "arc 1"       -> { isValid: true, type: "arc", orderIndex: 1, title: "Arc 1" }
 *   "Chapter 174" -> { isValid: true, type: "chapter", orderIndex: 174, title: "Chapter 174" }
 */
function parseNodeFolderName(folderName) {
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

  // Pattern 3: Chỉ là số (ví dụ: "01", "1", "10")
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
 * Đọc thông tin kích thước ảnh qua sharp (an toàn nếu lỗi)
 */
async function getImageDimensions(filePath) {
  try {
    const metadata = await sharp(filePath).metadata();
    return {
      width: metadata.width || null,
      height: metadata.height || null,
    };
  } catch {
    return { width: null, height: null };
  }
}

/**
 * Quét danh sách các truyện hợp lệ trong thư mục gốc
 */
async function scanStoryFolders(sourceDir, options) {
  if (!fs.existsSync(sourceDir)) {
    throw new Error(`Thư mục nguồn không tồn tại hoặc không thể truy cập: ${sourceDir}`);
  }

  const entries = await fs.promises.readdir(sourceDir, { withFileTypes: true });
  let storyFolders = entries
    .filter((e) => e.isDirectory() && !e.name.startsWith("."))
    .map((e) => e.name)
    .sort((a, b) => a.localeCompare(b, "vi", { sensitivity: "base" }));

  // Lọc theo tên truyện nếu được chỉ định
  if (options.storyFilter) {
    const filterLower = options.storyFilter.toLowerCase().trim();
    storyFolders = storyFolders.filter((name) => name.toLowerCase().includes(filterLower));
  }

  // Áp dụng giới hạn số lượng truyện
  if (options.limit > 0) {
    storyFolders = storyFolders.slice(0, options.limit);
  }

  return storyFolders;
}

/**
 * Quét nội dung chi tiết của một truyện (các node và ảnh)
 */
export async function inspectStory(storyDir) {
  const items = await fs.promises.readdir(storyDir, { withFileTypes: true });

  // 1. Đọc file info.json nếu có
  const info = await readStoryInfoJson(storyDir);

  // 2. Tìm ảnh bìa cover art nếu có
  let coverArtFile = null;
  const coverFiles = items.filter((i) => i.isFile() && /^(cover_art|cover|poster)\.(jpe?g|png|webp)$/i.test(i.name));
  if (coverFiles.length > 0) {
    coverArtFile = path.join(storyDir, coverFiles[0].name);
  } else if (info?.raw?.cover_art && typeof info.raw.cover_art === "string") {
    const customCover = path.join(storyDir, info.raw.cover_art);
    if (fs.existsSync(customCover)) {
      coverArtFile = customCover;
    }
  }

  // 3. Tìm các thư mục node / chapter
  const rawSubdirs = items.filter((i) => i.isDirectory() && !i.name.startsWith("."));
  const parsedNodes = [];

  for (const dir of rawSubdirs) {
    const parsed = parseNodeFolderName(dir.name);
    if (!parsed.isValid) continue;

    const nodePath = path.join(storyDir, dir.name);
    const nodeFiles = await fs.promises.readdir(nodePath, {
      withFileTypes: true,
    });

    // Lọc các file ảnh hợp lệ
    const imageFiles = nodeFiles
      .filter((f) => f.isFile() && SUPPORTED_IMAGE_EXTS.has(path.extname(f.name).toLowerCase()))
      .map((f) => f.name)
      // Sắp xếp tự nhiên theo thứ tự trang (000.jpg, 001.jpg, 002.jpg,...)
      .sort((a, b) => a.localeCompare(b, undefined, { numeric: true, sensitivity: "base" }));

    if (imageFiles.length > 0) {
      parsedNodes.push({
        ...parsed,
        nodePath,
        imageFiles,
      });
    }
  }

  // Sắp xếp các node theo thứ tự orderIndex tăng dần
  parsedNodes.sort((a, b) => a.orderIndex - b.orderIndex);

  return {
    coverArtFile,
    nodes: parsedNodes,
    info,
  };
}

/**
 * Hàm chính thực thi
 */
async function main() {
  const startTime = Date.now();
  const options = parseCliArgs();

  console.log("\n================================================================================");
  console.log(" 🚀 MANGAMENT - SCRIPT UPLOAD STORIES TỪ THƯ MỤC");
  console.log("================================================================================");
  console.log(`📁 Thư mục nguồn:   ${options.sourceDir}`);
  console.log(`🎯 Giới hạn truyện: ${options.limit > 0 ? options.limit : "Tất cả (quét lần lượt hết)"}`);
  if (options.storyFilter) console.log(`🔍 Lọc theo tên:    "${options.storyFilter}"`);
  if (options.chapterLimit) console.log(`📑 Giới hạn chapter: ${options.chapterLimit} chapter/truyện`);
  const publicStoriesDir = path.join(options.publicDir, "images/stories");

  console.log(`⚙️  Chế độ:          ${options.dryRun ? "🔍 DRY-RUN (Chỉ kiểm tra, không ghi DB)" : "⚡ THỰC THI (Ghi vào DB)"}`);
  console.log(`📦 Sao chép ảnh:    ${options.copyFiles ? `Bật (Lưu vào: ${publicStoriesDir})` : "Tắt"}`);
  console.log("--------------------------------------------------------------------------------\n");

  // Kiểm tra kết nối DB nếu không phải dry-run
  let prisma = null;
  if (!options.dryRun) {
    try {
      prisma = await getDb();
      await prisma.$queryRaw`SELECT 1`;
      console.log("✅ Kết nối cơ sở dữ liệu PostgreSQL thành công.\n");
    } catch (err) {
      console.error("❌ Không thể kết nối cơ sở dữ liệu PostgreSQL!");
      console.error("   Chi tiết:", err.message);
      console.error("\n💡 Gợi ý: Hãy đảm bảo Docker container database đang chạy và đúng PORT cấu hình.");
      process.exit(1);
    }
  }

  // Đảm bảo thư mục lưu trữ ảnh tồn tại nếu bật tính năng copy
  if (options.copyFiles && !options.dryRun) {
    await fs.promises.mkdir(publicStoriesDir, { recursive: true });
  }

  // 1. Quét danh sách truyện
  const storyFolderNames = await scanStoryFolders(options.sourceDir, options);
  console.log(`🔎 Tìm thấy ${storyFolderNames.length} thư mục truyện thỏa mãn điều kiện.\n`);

  if (storyFolderNames.length === 0) {
    console.log("⚠️ Không có truyện nào để xử lý. Kết thúc.");
    return;
  }

  // Thống kê tổng hợp
  const stats = {
    storiesProcessed: 0,
    storiesCreated: 0,
    nodesProcessed: 0,
    nodesCreated: 0,
    imagesProcessed: 0,
    imagesCreated: 0,
  };

  const processedStories = new Map();

  // 2. Lặp qua từng truyện
  for (let sIdx = 0; sIdx < storyFolderNames.length; sIdx++) {
    const folderName = storyFolderNames[sIdx];
    const storyDir = path.join(options.sourceDir, folderName);
    const storyProgress = `[${sIdx + 1}/${storyFolderNames.length}]`;

    // Quét chi tiết các node và ảnh của truyện
    const storyData = await inspectStory(storyDir);
    const finalTitle = storyData.info?.title || folderName;

    const titleLog = storyData.info?.title && storyData.info.title !== folderName ? `"${finalTitle}" (thư mục: ${folderName})` : `"${finalTitle}"`;
    console.log(`${storyProgress} 📚 Đang xử lý truyện: ${titleLog}`);

    let nodesToProcess = storyData.nodes;

    if (options.chapterLimit && options.chapterLimit > 0) {
      nodesToProcess = nodesToProcess.slice(0, options.chapterLimit);
    }

    const totalImagesInStory = nodesToProcess.reduce((sum, n) => sum + n.imageFiles.length, 0);
    console.log(`   └── Tìm thấy: ${storyData.coverArtFile ? "1 ảnh bìa, " : ""}${nodesToProcess.length} chapters, tổng ${totalImagesInStory} ảnh.`);

    if (storyData.info) {
      const infoDetails = [];
      if (storyData.info.summary) infoDetails.push(`tóm tắt (${storyData.info.summary.length} ký tự)`);
      if (storyData.info.genres.length > 0) infoDetails.push(`${storyData.info.genres.length} thể loại: [${storyData.info.genres.join(", ")}]`);
      if (storyData.info.authors.length > 0) infoDetails.push(`tác giả: [${storyData.info.authors.join(", ")}]`);
      if (storyData.info.other_titles.length > 0) infoDetails.push(`${storyData.info.other_titles.length} tên khác`);
      if (storyData.info.nation || storyData.info.nation_id) infoDetails.push(`quốc gia: ${storyData.info.nation || storyData.info.nation_id}`);
      if (infoDetails.length > 0) {
        console.log(`   📋 Metadata info.json: ${infoDetails.join(" | ")}`);
      }
    }

    if (options.dryRun) {
      // Chế độ Dry Run: Chỉ in cấu trúc mô phỏng
      stats.storiesProcessed++;
      stats.nodesProcessed += nodesToProcess.length;
      stats.imagesProcessed += totalImagesInStory;

      nodesToProcess.forEach((n) => {
        console.log(`       - ${n.title} (${n.type}, order: ${n.orderIndex}): ${n.imageFiles.length} ảnh`);
      });
      console.log("");
      continue;
    }

    // Chế độ Thực thi: Tạo và lưu vào Database
    stats.storiesProcessed++;

    // Resolve nation & poster từ info.json
    const resolvedNationId = await resolveNation(prisma, storyData.info?.nation_id, storyData.info?.nation);
    const resolvedPosterId = await resolvePoster(prisma, storyData.info?.poster_id);

    // 2.1 Tạo hoặc lấy Story đã có
    let story = await prisma.story.findFirst({
      where: {
        OR: [{ title: finalTitle }, { title: folderName }],
      },
    });

    if (!story) {
      const storyType = storyData.info?.type?.toLowerCase().includes("novel") ? "light_novel" : "manga";
      const validStatuses = ["ongoing", "finished", "postpone", "upcoming"];
      const storyStatus = validStatuses.includes(storyData.info?.status?.toLowerCase()) ? storyData.info.status.toLowerCase() : "ongoing";

      story = await prisma.story.create({
        data: {
          title: finalTitle,
          other_titles: storyData.info?.other_titles || [],
          type: storyType,
          status: storyStatus,
          summary: storyData.info?.summary || null,
          nation_id: resolvedNationId,
          poster_id: resolvedPosterId,
          deleted_status: "not_deleted",
          is_actived: true,
        },
      });
      stats.storiesCreated++;
      console.log(`   ✨ Đã tạo bản ghi Story mới (ID: ${story.id})`);
    } else {
      console.log(`   ℹ️ Sử dụng Story hiện có (ID: ${story.id})`);
      const updateData = {};
      if (storyData.info?.summary && !story.summary) {
        updateData.summary = storyData.info.summary;
      }
      if (storyData.info?.other_titles?.length > 0 && (!story.other_titles || story.other_titles.length === 0)) {
        updateData.other_titles = storyData.info.other_titles;
      }
      if (resolvedNationId && !story.nation_id) {
        updateData.nation_id = resolvedNationId;
      }
      if (resolvedPosterId && !story.poster_id) {
        updateData.poster_id = resolvedPosterId;
      }
      if (Object.keys(updateData).length > 0) {
        story = await prisma.story.update({
          where: { id: story.id },
          data: updateData,
        });
        console.log(`   📝 Đã cập nhật metadata cho Story từ info.json`);
      }
    }

    processedStories.set(story.id, story);

    // 2.2 Xử lý Cover Art nếu có và truyện chưa có bìa
    if (storyData.coverArtFile && !story.cover_art_id) {
      try {
        const coverExt = path.extname(storyData.coverArtFile);
        const coverStat = await fs.promises.stat(storyData.coverArtFile);
        const coverDims = await getImageDimensions(storyData.coverArtFile);
        const coverImageId = crypto.randomUUID();
        const coverFilename = `cover_${story.id}_${Date.now()}${coverExt}`;
        const relativeCoverPath = `/public/images/stories/${coverFilename}`;

        if (options.copyFiles) {
          await fs.promises.copyFile(storyData.coverArtFile, path.join(publicStoriesDir, coverFilename));
        }

        await prisma.image.create({
          data: {
            id: coverImageId,
            provider: "local",
            mine_type: getMimeType(coverExt),
            size: coverStat.size,
            path: relativeCoverPath,
            width: coverDims.width,
            height: coverDims.height,
          },
        });

        await prisma.story.update({
          where: { id: story.id },
          data: { cover_art_id: coverImageId },
        });

        console.log(`   🖼️ Đã gán ảnh bìa Cover Art cho truyện.`);
      } catch (covErr) {
        console.warn(`   ⚠️ Không thể xử lý ảnh bìa: ${covErr.message}`);
      }
    }

    // 2.3 Liên kết thể loại (Genres) nếu có từ info.json
    if (storyData.info?.genres?.length > 0) {
      try {
        const genreIds = await resolveGenres(prisma, storyData.info.genres);
        if (genreIds.length > 0) {
          await prisma.story_Genre.createMany({
            data: genreIds.map((genre_id) => ({
              story_id: story.id,
              genre_id,
            })),
            skipDuplicates: true,
          });
          console.log(`   🏷️ Đã liên kết ${genreIds.length} thể loại cho truyện.`);
        }
      } catch (genreErr) {
        console.warn(`   ⚠️ Lỗi liên kết thể loại: ${genreErr.message}`);
      }
    }

    // 2.4 Liên kết tác giả (Authors) nếu có từ info.json
    if (storyData.info?.authors?.length > 0) {
      try {
        const authorIds = await resolveAuthors(prisma, storyData.info.authors);
        if (authorIds.length > 0) {
          await prisma.story_Author.createMany({
            data: authorIds.map((author_id) => ({
              story_id: story.id,
              author_id,
            })),
            skipDuplicates: true,
          });
          console.log(`   ✍️ Đã liên kết ${authorIds.length} tác giả cho truyện.`);
        }
      } catch (authorErr) {
        console.warn(`   ⚠️ Lỗi liên kết tác giả: ${authorErr.message}`);
      }
    }

    // 2.5 Xử lý từng Chapter / Node
    let newNodesCount = 0;

    for (const nodeData of nodesToProcess) {
      stats.nodesProcessed++;

      // Tìm hoặc tạo StoryNode
      let storyNode = await prisma.storyNode.findFirst({
        where: {
          story_id: story.id,
          type: nodeData.type,
          order_index: nodeData.orderIndex,
          parent_id: null,
        },
      });

      let isNodeNew = false;
      if (!storyNode) {
        storyNode = await prisma.storyNode.create({
          data: {
            story_id: story.id,
            title: nodeData.title,
            type: nodeData.type,
            order_index: nodeData.orderIndex,
            deleted_status: "not_deleted",
          },
        });
        isNodeNew = true;
        newNodesCount++;
        stats.nodesCreated++;
      }

      // Kiểm tra xem node đã có nội dung chưa để tránh chèn trùng lặp
      const existingContentsCount = await prisma.storyNodeContent.count({
        where: { story_node_id: storyNode.id },
      });

      if (existingContentsCount >= nodeData.imageFiles.length) {
        console.log(`       ⏩ ${nodeData.title}: Đã có ${existingContentsCount} trang ảnh, bỏ qua chèn trùng.`);
        continue;
      }

      // Chuẩn bị batch Images & Contents
      const imagesBatch = [];
      const contentsBatch = [];

      for (let pIdx = 0; pIdx < nodeData.imageFiles.length; pIdx++) {
        const imgName = nodeData.imageFiles[pIdx];
        const srcImgPath = path.join(nodeData.nodePath, imgName);
        const imgExt = path.extname(imgName);

        stats.imagesProcessed++;

        const imgStat = await fs.promises.stat(srcImgPath);
        const imgDims = await getImageDimensions(srcImgPath);

        const imageId = crypto.randomUUID();
        const contentId = crypto.randomUUID();

        // Tên file đích tránh trùng lặp
        const destFilename = `${story.id}_${storyNode.id}_${pIdx}_${imgName}`;
        const relativeImgPath = `/public/images/stories/${destFilename}`;

        if (options.copyFiles) {
          await fs.promises.copyFile(srcImgPath, path.join(publicStoriesDir, destFilename));
        }

        imagesBatch.push({
          id: imageId,
          provider: "local",
          mine_type: getMimeType(imgExt),
          size: imgStat.size,
          path: relativeImgPath,
          width: imgDims.width,
          height: imgDims.height,
        });

        contentsBatch.push({
          id: contentId,
          story_node_id: storyNode.id,
          type: "image",
          order_index: pIdx,
          image_id: imageId,
          deleted_status: "not_deleted",
        });
      }

      // Ghi batch vào DB
      if (imagesBatch.length > 0) {
        await prisma.image.createMany({
          data: imagesBatch,
          skipDuplicates: true,
        });

        await prisma.storyNodeContent.createMany({
          data: contentsBatch,
          skipDuplicates: true,
        });

        stats.imagesCreated += imagesBatch.length;
      }

      const nodeStatusTag = isNodeNew ? "✨ Tạo mới" : "ℹ️ Đã có";
      console.log(`       └── ${nodeData.title} (${nodeStatusTag}): Đã nạp ${contentsBatch.length} trang ảnh.`);
    }

    // Cập nhật số lượng node con cho Story nếu có node mới được tạo
    if (newNodesCount > 0) {
      await prisma.story.update({
        where: { id: story.id },
        data: { number_of_children: { increment: newNodesCount } },
      });
      const syncFn = await getSyncStoryChildren();
      await syncFn(story.id, prisma);
    }

    console.log("");
  }

  // 3. Nâng version story trong Redis và reset cache
  if (!options.dryRun && processedStories.size > 0) {
    try {
      const { default: redisUtils } = await import("../../src/utils/Redis.js");
      const ids = Array.from(processedStories.keys());
      const titles = Array.from(processedStories.values())
        .map((s) => s.title)
        .filter(Boolean);
      if (typeof redisUtils.clearStoriesCache === "function") {
        await redisUtils.clearStoriesCache(ids, titles);
      } else {
        await redisUtils.stories().incr();
        await redisUtils.storyNodes().incr();
        for (const id of ids) {
          await redisUtils.stories(id).incr();
          await redisUtils.storyNodes(id).incr();
        }
      }
      console.log("🔄 Đã nâng version và reset cache story trong Redis thành công.\n");
    } catch {
      // Bỏ qua lỗi kết nối redis khi chạy standalone script
    }
  }

  // 4. In báo cáo tổng kết
  const durationSec = ((Date.now() - startTime) / 1000).toFixed(2);
  console.log("================================================================================");
  console.log(" 📊 BÁO CÁO TỔNG KẾT QUÁ TRÌNH UPLOAD");
  console.log("================================================================================");
  console.log(`⏱️  Thời gian thực thi: ${durationSec} giây`);
  console.log(`📚 Truyện xử lý:        ${stats.storiesProcessed} (Tạo mới: ${stats.storiesCreated})`);
  console.log(`📑 Chapter / Nodes:     ${stats.nodesProcessed} (Tạo mới: ${stats.nodesCreated})`);
  console.log(`🖼️  Trang ảnh:           ${stats.imagesProcessed} (Tạo mới trong DB: ${stats.imagesCreated})`);
  console.log("================================================================================\n");

  if (!options.dryRun && prisma) {
    await prisma.$disconnect();
  }
}

process.stdout.on("error", (err) => {
  if (err.code === "EPIPE") process.exit(0);
});

if (process.argv[1] && (process.argv[1].endsWith("upload-stories/index.js") || process.argv[1].endsWith("upload-stories"))) {
  main().catch((err) => {
    console.error("\n❌ LỖI TRONG QUÁ TRÌNH THỰC THI:", err);
    process.exit(1);
  });
}
