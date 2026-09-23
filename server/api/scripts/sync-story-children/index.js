#!/usr/bin/env node

/**
 * Script đồng bộ danh sách children (dạng JSONB cây phân cấp) cho các Story trong database.
 * Không cần worker chạy ngầm, script kết nối trực tiếp database và cập nhật.
 *
 * Cách dùng:
 *   node scripts/sync-story-children.js [tùy chọn]
 *
 * Tùy chọn:
 *   --story, -s <id|title>   Đồng bộ riêng một truyện theo ID hoặc Tiêu đề
 *   --all                    Đồng bộ toàn bộ truyện (mặc định)
 *   --empty-only             Chỉ đồng bộ những truyện chưa có children (children rỗng)
 *   --concurrency, -c <num>  Số lượng truyện xử lý đồng thời (mặc định: 5)
 *   --dry-run                Chạy thử mô phỏng, in số lượng nodes mà không ghi vào DB
 *   --help, -h               Hiển thị hướng dẫn
 */

import path from "path";
import { fileURLToPath } from "url";
import dotenvFlow from "dotenv-flow";
import pLimit from "p-limit";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

process.env.NODE_ENV = process.env.NODE_ENV || "development";

// Nạp biến môi trường từ server/api
dotenvFlow.config({
  path: path.resolve(__dirname, ".."),
  node_env: process.env.NODE_ENV,
  silent: true,
});

const { default: db } = await import("../../configs/db.js");
const { BuildStoryChildrenTree, SyncStoryChildren } = await import("../../src/services/story.service.js");

function parseArgs() {
  const args = process.argv.slice(2);
  const options = {
    story: null,
    concurrency: 5,
    emptyOnly: false,
    dryRun: false,
    help: false,
  };

  for (let i = 0; i < args.length; i++) {
    const arg = args[i];
    if (arg === "--help" || arg === "-h") {
      options.help = true;
    } else if (arg === "--dry-run") {
      options.dryRun = true;
    } else if (arg === "--empty-only") {
      options.emptyOnly = true;
    } else if (arg === "--concurrency" || arg === "-c") {
      const val = parseInt(args[++i], 10);
      if (!isNaN(val) && val > 0) options.concurrency = val;
    } else if (arg === "--story" || arg === "-s") {
      options.story = args[++i];
    }
  }

  return options;
}

function countTreeNodes(tree = []) {
  let count = 0;
  for (const node of tree) {
    count += 1;
    if (node.children && node.children.length > 0) {
      count += countTreeNodes(node.children);
    }
  }
  return count;
}

async function main() {
  const options = parseArgs();

  if (options.help) {
    console.log(`
📚 SCRIPT SYNC STORY CHILDREN LIST (JSONB)
===================================================
Cách dùng:
  node scripts/sync-story-children.js [tùy chọn]

Tùy chọn:
  --story, -s <id|title>   Đồng bộ riêng một truyện theo ID hoặc Tiêu đề
  --empty-only             Chỉ đồng bộ những truyện đang có children rỗng
  --concurrency, -c <num>  Số lượng truyện xử lý đồng thời (mặc định: 5)
  --dry-run                Chạy thử mô phỏng, không ghi vào DB
  --help, -h               Hiển thị trợ giúp
    `);
    process.exit(0);
  }

  console.log("================================================================================");
  console.log(" 🚀 BẮT ĐẦU ĐỒNG BỘ CHILDREN JSONB CHO STORY");
  console.log(` ⚙️  Chế độ: ${options.dryRun ? "DRY-RUN (Chỉ kiểm tra, không ghi DB)" : "LIVE (Cập nhật DB)"}`);
  console.log(` ⚡ Concurrency: ${options.concurrency}`);
  if (options.story) console.log(` 🎯 Mục tiêu: Truyện "${options.story}"`);
  if (options.emptyOnly) console.log(" 🔍 Lọc: Chỉ truyện có children rỗng");
  console.log("================================================================================\n");

  const startTime = Date.now();

  try {
    // 1. Tìm các truyện cần đồng bộ
    const where = {
      deleted_status: "not_deleted",
    };

    if (options.story) {
      // Có thể là UUID hoặc title
      where.OR = [
        { title: { contains: options.story, mode: "insensitive" } },
        ...(options.story.match(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i) ? [{ id: options.story }] : []),
      ];
    }

    const stories = await db.story.findMany({
      where,
      select: {
        id: true,
        title: true,
        children: true,
      },
      orderBy: { updated_at: "desc" },
    });

    if (stories.length === 0) {
      console.log("⚠️  Không tìm thấy truyện nào phù hợp với điều kiện.");
      return;
    }

    const targetStories = options.emptyOnly ? stories.filter((s) => !s.children || (Array.isArray(s.children) && s.children.length === 0)) : stories;

    console.log(`📋 Tìm thấy tổng cộng ${targetStories.length} truyện cần đồng bộ.\n`);

    const limit = pLimit(options.concurrency);
    let successCount = 0;
    let failCount = 0;
    let totalNodesCount = 0;

    let progressIndex = 0;
    const tasks = targetStories.map((story) =>
      limit(async () => {
        const currentIndex = ++progressIndex;
        try {
          if (options.dryRun) {
            const tree = await BuildStoryChildrenTree(story.id, db);
            const nodeCount = countTreeNodes(tree);
            totalNodesCount += nodeCount;
            successCount++;
            console.log(
              `[${currentIndex}/${targetStories.length}] 🔍 [DRY-RUN] "${story.title}" (${story.id}) -> ${tree.length} root nodes, ${nodeCount} tổng số nodes.`,
            );
          } else {
            const tree = await SyncStoryChildren(story.id, db);
            const nodeCount = countTreeNodes(tree);
            totalNodesCount += nodeCount;
            successCount++;
            console.log(
              `[${currentIndex}/${targetStories.length}] ✅ "${story.title}" (${story.id}) -> Đã đồng bộ ${tree.length} root nodes (${nodeCount} tổng số nodes).`,
            );
          }
        } catch (error) {
          failCount++;
          console.error(`[${currentIndex}/${targetStories.length}] ❌ Lỗi đồng bộ "${story.title}" (${story.id}):`, error.message);
        }
      }),
    );

    await Promise.all(tasks);

    const durationSec = ((Date.now() - startTime) / 1000).toFixed(2);
    console.log("\n================================================================================");
    console.log(" 📊 BÁO CÁO TỔNG KẾT ĐỒNG BỘ CHILDREN");
    console.log("================================================================================");
    console.log(`  - Tổng số truyện xử lý   : ${targetStories.length}`);
    console.log(`  - Thành công              : ${successCount}`);
    console.log(`  - Thất bại                : ${failCount}`);
    console.log(`  - Tổng số nodes được gộp  : ${totalNodesCount}`);
    console.log(`  - Thời gian thực thi      : ${durationSec}s`);
    console.log("================================================================================\n");
  } catch (err) {
    console.error("❌ Đã xảy ra lỗi ngoài ý muốn:", err);
  } finally {
    await db.$disconnect();
  }
}

main();
