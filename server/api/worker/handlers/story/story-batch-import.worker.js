import fs from "fs";
import path from "path";
import crypto from "crypto";
import sharp from "sharp";
import { Worker } from "bullmq";
import db from "../../../configs/db.js";
import redisUtils from "../../../src/utils/Redis.js";
import storyQueue from "../../queues/story.queue.js";
import { isUUID } from "../../../src/utils/Validators.js";
import { getTempDir, extractZipArchive, findCsvInDirectory, cleanupOrMoveProcessedZip, safeUnlink } from "../../../src/utils/zip/zipStorage.js";
import { parseStoriesSpreadsheet } from "../../../src/utils/spreadsheet.parser.js";
import { SyncStoryChildren } from "../../../src/services/story.service.js";
import { connection } from "./connection.js";

async function resolveNationId(nationId, nationName, nationsCache) {
  // Ưu tiên nation_id nếu có
  if (nationId) {
    if (nationsCache.has(nationId)) return nationsCache.get(nationId);
    const nationById = await db.nation.findUnique({ where: { id: nationId } });
    if (nationById) {
      nationsCache.set(nationId, nationById.id);
      return nationById.id;
    }
  }

  // Fallback: Tìm theo tên nation (unique)
  if (nationName) {
    const key = nationName.toLowerCase().trim();
    if (nationsCache.has(key)) return nationsCache.get(key);
    const nationByName = await db.nation.findFirst({
      where: { name: { equals: nationName.trim(), mode: "insensitive" } },
    });
    if (nationByName) {
      nationsCache.set(key, nationByName.id);
      return nationByName.id;
    }
    nationsCache.set(key, null);
  }

  // Cả hai đều trống hoặc không tìm thấy -> để trống (null)
  return null;
}

async function resolveImageId(imageId, imagesCache) {
  if (!imageId) return null;
  if (imagesCache.has(imageId)) return imagesCache.get(imageId);

  const img = await db.image.findUnique({ where: { id: imageId } });
  if (img) {
    imagesCache.set(imageId, img.id);
    return img.id;
  }
  imagesCache.set(imageId, null);
  return null;
}

async function resolveUserId(userId, usersCache) {
  if (!userId) return null;
  if (usersCache.has(userId)) return usersCache.get(userId);

  if (!isUUID(userId)) {
    usersCache.set(userId, null);
    return null;
  }

  const user = await db.user.findUnique({
    where: { id: userId },
    select: { id: true },
  });

  if (user) {
    usersCache.set(userId, user.id);
    return user.id;
  }

  usersCache.set(userId, null);
  return null;
}

async function resolveGenreIds(genres = [], genresCache) {
  if (!genres || genres.length === 0) return [];
  const resolvedIds = [];

  for (const genreName of genres) {
    if (!genreName || typeof genreName !== "string") continue;
    const cleanName = genreName.trim();
    if (!cleanName) continue;
    const cacheKey = cleanName.toLowerCase();

    if (genresCache.has(cacheKey)) {
      const cachedId = genresCache.get(cacheKey);
      if (cachedId) resolvedIds.push(cachedId);
      continue;
    }

    const genre = await db.genre.findFirst({
      where: {
        name: { equals: cleanName, mode: "insensitive" },
        deleted_status: "not_deleted",
      },
      select: { id: true },
    });

    if (genre) {
      genresCache.set(cacheKey, genre.id);
      resolvedIds.push(genre.id);
    } else {
      genresCache.set(cacheKey, null);
    }
  }

  return [...new Set(resolvedIds)];
}

async function resolveAuthorIds(authorIds = [], authorsCache) {
  if (!authorIds || authorIds.length === 0) return [];
  const resolvedIds = [];

  for (const rawId of authorIds) {
    if (!rawId || typeof rawId !== "string") continue;
    const cleanId = rawId.trim();
    if (!cleanId || !isUUID(cleanId)) continue;

    if (authorsCache.has(cleanId)) {
      const cachedId = authorsCache.get(cleanId);
      if (cachedId) resolvedIds.push(cachedId);
      continue;
    }

    const author = await db.author.findUnique({
      where: { id: cleanId },
      select: { id: true },
    });

    if (author) {
      authorsCache.set(cleanId, author.id);
      resolvedIds.push(author.id);
    } else {
      authorsCache.set(cleanId, null);
    }
  }

  return [...new Set(resolvedIds)];
}

function getMimeType(ext) {
  switch ((ext || "").toLowerCase()) {
    case ".png":
      return "image/png";
    case ".webp":
      return "image/webp";
    case ".avif":
      return "image/avif";
    case ".gif":
      return "image/gif";
    case ".jpg":
    case ".jpeg":
    default:
      return "image/jpeg";
  }
}

async function getImageDimensions(filePath) {
  try {
    const meta = await sharp(filePath).metadata();
    return { width: meta.width || null, height: meta.height || null };
  } catch {
    return { width: null, height: null };
  }
}

function resolvePublicStoriesDir() {
  const publicBase = process.env.PUBLIC_DIR ? path.resolve(process.env.PUBLIC_DIR) : path.resolve(process.cwd(), "public");
  const storiesDir = path.join(publicBase, "images/stories");
  fs.mkdirSync(storiesDir, { recursive: true });
  return storiesDir;
}

async function importImageFromRelativePath(relPath, csvDir, prefix = "img") {
  if (!relPath || !csvDir) return null;

  const normalizedRel = String(relPath).replace(/\\/g, "/");
  const fullSrcPath = path.resolve(csvDir, normalizedRel);

  try {
    if (!fs.existsSync(fullSrcPath)) {
      console.warn(`[BatchImport] Ảnh không tồn tại tại: ${fullSrcPath} (từ đường dẫn: ${relPath})`);
      return null;
    }

    const stat = await fs.promises.stat(fullSrcPath);
    if (!stat.isFile()) return null;

    const ext = path.extname(fullSrcPath).toLowerCase() || ".jpg";
    const publicStoriesDir = resolvePublicStoriesDir();
    const imageId = crypto.randomUUID();
    const destFilename = `${prefix}_${Date.now()}_${crypto.randomUUID().slice(0, 8)}${ext}`;
    const destPath = path.join(publicStoriesDir, destFilename);

    await fs.promises.copyFile(fullSrcPath, destPath);

    const dims = await getImageDimensions(destPath);
    const relativeDbPath = `/public/images/stories/${destFilename}`;

    const imageRecord = await db.image.create({
      data: {
        id: imageId,
        provider: "local",
        mine_type: getMimeType(ext),
        size: stat.size,
        path: relativeDbPath,
        width: dims.width,
        height: dims.height,
      },
    });

    return imageRecord.id;
  } catch (err) {
    console.warn(`[BatchImport] Lỗi sao chép ảnh ${relPath}: ${err.message}`);
    return null;
  }
}

export async function executeBatchImportRows({ rows = [], userId, fileName, csvDir }) {
  console.log(`[BatchImport] Bắt đầu import ${rows.length} dòng từ file ${fileName || "bảng tính"}${csvDir ? ` (Thư mục CSV: ${csvDir})` : ""}`);

  const storiesCache = new Map();
  const nodesCache = new Map();
  const nationsCache = new Map();
  const imagesCache = new Map();
  const usersCache = new Map();
  const genresCache = new Map();
  const authorsCache = new Map();
  const affectedStories = new Map();

  let importedStoriesCount = 0;
  let importedNodesCount = 0;
  let importedContentsCount = 0;

  // Kiểm tra userId có tồn tại trong bảng User không để tránh lỗi Foreign Key Constraint
  const validPosterId = await resolveUserId(userId, usersCache);

  try {
    for (const item of rows) {
      const { story: sData } = item;
      if (!sData || !sData.title) continue;

      const storyTitleKey = sData.title.toLowerCase().trim();
      let story = storiesCache.get(storyTitleKey);

      if (!story) {
        story = await db.story.findUnique({
          where: { title: sData.title },
        });

        if (!story) {
          const resolvedNationId = await resolveNationId(sData.nation_id, sData.nation, nationsCache);
          let resolvedCoverArtId = await resolveImageId(sData.cover_art_id, imagesCache);

          if (!resolvedCoverArtId && sData.cover_art_path && csvDir) {
            resolvedCoverArtId = await importImageFromRelativePath(sData.cover_art_path, csvDir, `cover_${storyTitleKey.replace(/[^a-z0-9]/gi, "_")}`);
          }

          let resolvedStoryPosterId = validPosterId;
          if (sData.poster_id) {
            const explicitPoster = await resolveUserId(sData.poster_id, usersCache);
            if (explicitPoster) resolvedStoryPosterId = explicitPoster;
          }

          story = await db.story.create({
            data: {
              title: sData.title,
              other_titles: sData.other_titles || [],
              type: sData.type || "manga",
              status: sData.status || "ongoing",
              nation_id: resolvedNationId,
              deleted_status: sData.deleted_status || "not_deleted",
              is_actived: sData.is_actived ?? true,
              summary: sData.summary || null,
              cover_art_id: resolvedCoverArtId,
              poster_id: resolvedStoryPosterId,
            },
          });
          importedStoriesCount++;
        } else if (!story.cover_art_id && sData.cover_art_path && csvDir) {
          const newCoverId = await importImageFromRelativePath(sData.cover_art_path, csvDir, `cover_${story.id}`);
          if (newCoverId) {
            await db.story.update({
              where: { id: story.id },
              data: { cover_art_id: newCoverId },
            });
            story.cover_art_id = newCoverId;
          }
        }

        storiesCache.set(storyTitleKey, story);
      }

      affectedStories.set(story.id, story);

      // Attach genres if provided
      const genresList = sData.genres || [];
      if (genresList.length > 0) {
        const resolvedGenreIds = await resolveGenreIds(genresList, genresCache);
        if (resolvedGenreIds.length > 0) {
          await db.story_Genre.createMany({
            data: resolvedGenreIds.map((genre_id) => ({
              story_id: story.id,
              genre_id,
            })),
            skipDuplicates: true,
          });
        }
      }

      // Attach authors if provided
      const authorIdsList = sData.author_ids || sData.authorIds || [];
      if (authorIdsList.length > 0) {
        const resolvedAuthorIds = await resolveAuthorIds(authorIdsList, authorsCache);
        if (resolvedAuthorIds.length > 0) {
          await db.story_Author.createMany({
            data: resolvedAuthorIds.map((author_id) => ({
              story_id: story.id,
              author_id,
            })),
            skipDuplicates: true,
          });
        }
      }

      // Support dynamic N-level nodes (or fallback to parentNode/childNode)
      const nodes = Array.isArray(item.nodes) ? item.nodes : [item.parentNode, item.childNode].filter(Boolean);

      let currentParentId = null;

      for (let depth = 0; depth < nodes.length; depth++) {
        const nodeData = nodes[depth];
        if (!nodeData || (!nodeData.title && nodeData.order_index === null && !nodeData.content)) {
          continue;
        }

        const nodeOrder = Number(nodeData.order_index ?? 1);
        const nodeKey = `${story.id}_${currentParentId || "root"}_${nodeOrder}_${nodeData.title || ""}`;
        let currentNode = nodesCache.get(nodeKey);

        if (!currentNode) {
          currentNode = await db.storyNode.findFirst({
            where: {
              story_id: story.id,
              parent_id: currentParentId,
              order_index: nodeOrder,
            },
          });

          if (!currentNode) {
            currentNode = await db.storyNode.create({
              data: {
                story_id: story.id,
                parent_id: currentParentId,
                title: nodeData.title || null,
                type: nodeData.type || (depth === 0 ? "volume" : "chapter"),
                order_index: nodeOrder,
                deleted_status: nodeData.deleted_status || "not_deleted",
                poster_id: validPosterId,
              },
            });

            if (currentParentId) {
              await db.storyNode.update({
                where: { id: currentParentId },
                data: { number_of_children: { increment: 1 } },
              });
            } else {
              await db.story.update({
                where: { id: story.id },
                data: { number_of_children: { increment: 1 } },
              });
            }
            importedNodesCount++;
          }

          nodesCache.set(nodeKey, currentNode);
        }

        // Nội dung của Node (nếu có)
        if (
          nodeData.content &&
          (nodeData.content.content || nodeData.content.image_id || nodeData.content.image_path || nodeData.content.order_index !== null)
        ) {
          let contentImageId = await resolveImageId(nodeData.content.image_id, imagesCache);
          if (!contentImageId && nodeData.content.image_path && csvDir) {
            contentImageId = await importImageFromRelativePath(
              nodeData.content.image_path,
              csvDir,
              `${story.id}_${currentNode.id}_${nodeData.content.order_index ?? 1}`,
            );
          }

          await db.storyNodeContent.create({
            data: {
              story_node_id: currentNode.id,
              order_index: Number(nodeData.content.order_index ?? 1),
              type: nodeData.content.type || (contentImageId ? "image" : "text"),
              content: nodeData.content.content || null,
              image_id: contentImageId,
              deleted_status: nodeData.content.deleted_status || "not_deleted",
            },
          });
          importedContentsCount++;
        }

        // Child node tiếp theo sẽ có parent_id là currentNode.id
        currentParentId = currentNode.id;
      }
    }

    // 1. Đồng bộ cây con (children tree) trực tiếp vào DB và trigger embedding
    for (const story of affectedStories.values()) {
      try {
        await SyncStoryChildren(story.id, db);
        storyQueue.addJob_EmbeddingStory(story.id);
      } catch (err) {
        console.error(`[BatchImport] Error triggering post-import for story ${story.id}:`, err);
      }
    }

    // 2. Nâng version story trong Redis và xóa cache cũ liên quan
    const affectedIds = Array.from(affectedStories.keys());
    const affectedTitles = Array.from(affectedStories.values())
      .map((s) => s.title)
      .filter(Boolean);

    if (typeof redisUtils.clearStoriesCache === "function") {
      await redisUtils.clearStoriesCache(affectedIds, affectedTitles);
    } else {
      await redisUtils.stories().incr();
      await redisUtils.storyNodes().incr();
      for (const id of affectedIds) {
        await redisUtils.stories(id).incr();
        await redisUtils.storyNodes(id).incr();
      }
      for (const t of affectedTitles) {
        await redisUtils.stories(t).incr();
      }
    }
    if (redisUtils.genres) await redisUtils.genres().incr();
    if (redisUtils.authors) await redisUtils.authors().incr();

    console.log(`[BatchImport] Hoàn tất import: ${importedStoriesCount} truyện mới, ${importedNodesCount} nodes, ${importedContentsCount} contents.`);
    return { importedStoriesCount, importedNodesCount, importedContentsCount };
  } catch (error) {
    console.error(`[BatchImport] ❌ Lỗi xử lý import file ${fileName}:`, error);
    throw error;
  }
}

export const batchImportStoriesWorker = new Worker(
  "batch-import-stories",
  async (job) => {
    const { rows = [], userId, fileName, csvDir } = job.data;
    return await executeBatchImportRows({ rows, userId, fileName, csvDir });
  },
  { connection, concurrency: 1 },
);

batchImportStoriesWorker.on("failed", (job, err) => {
  console.error(`[BatchImport] ❌ Job ${job?.id} thất bại (Lần thử ${job?.attemptsMade}/${job?.opts?.attempts}):`, err?.message || err);
});

export const batchImportZipWorker = new Worker(
  "batch-import-zip",
  async (job) => {
    const { zipFilePath, originalName, userId, sessionId, cleanupAfterProcessing } = job.data;
    console.log(`[BatchImportZip] Bắt đầu xử lý file zip ${originalName || zipFilePath} (Session: ${sessionId})`);

    const { processingDir: rootProcessingDir } = getTempDir();
    const processingDir = path.join(rootProcessingDir, sessionId);

    try {
      // 1. Giải nén vào thư mục processing
      await extractZipArchive(zipFilePath, processingDir);

      // 2. Tìm file CSV hoặc bảng tính bên trong thư mục giải nén
      const csvPath = await findCsvInDirectory(processingDir);
      if (!csvPath) {
        throw new Error("Không tìm thấy file .csv hoặc bảng tính hợp lệ trong file zip đã giải nén");
      }

      console.log(`[BatchImportZip] Đã tìm thấy file bảng tính: ${csvPath}`);

      // 3. Đọc và parse dữ liệu bảng tính
      const csvBuffer = await fs.promises.readFile(csvPath);
      const rows = parseStoriesSpreadsheet(csvBuffer);

      if (!rows || rows.length === 0) {
        throw new Error("File bảng tính trong file zip không có dòng dữ liệu truyện hợp lệ nào");
      }

      // 4. Thực thi import dữ liệu với đường dẫn thư mục CSV để resolve ảnh tương đối
      const csvDir = path.dirname(csvPath);
      await executeBatchImportRows({
        rows,
        userId,
        fileName: originalName || path.basename(zipFilePath),
        csvDir,
      });

      // 5. Dọn dẹp hoặc chuyển file zip vào thư mục completed
      await cleanupOrMoveProcessedZip({
        zipFilePath,
        processingDir,
        sessionId,
        cleanupAfterProcessing,
      });

      // Đảm bảo nâng version cache và reset khi toàn bộ file zip hoàn tất
      await redisUtils.stories().incr();
      await redisUtils.storyNodes().incr();

      console.log(`[BatchImportZip] ✅ Hoàn tất xử lý file zip (Session: ${sessionId})`);
    } catch (error) {
      console.error(`[BatchImportZip] ❌ Lỗi xử lý file zip (Session: ${sessionId}):`, error);
      if (processingDir && fs.existsSync(processingDir)) {
        await safeUnlink(processingDir);
      }
      throw error;
    }
  },
  { connection, concurrency: 1 },
);

batchImportZipWorker.on("failed", (job, err) => {
  console.error(`[BatchImportZip] ❌ Job ${job?.id} thất bại (Lần thử ${job?.attemptsMade}/${job?.opts?.attempts}):`, err?.message || err);
});
