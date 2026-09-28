import fs from "fs";
import path from "path";
import crypto from "crypto";
import sharp from "sharp";
import { Worker } from "bullmq";
import db from "../../../configs/db.js";
import redisUtils from "../../../src/utils/Redis.js";
import storyQueue from "../../queues/story.queue.js";
import { isUUID } from "../../../src/utils/Validators.js";
import {
  getTempDir,
  extractZipArchive,
  findCsvInDirectory,
  cleanupOrMoveProcessedZip,
  safeUnlink,
  mergeChunksSequentially,
} from "../../../src/utils/zip/zipStorage.js";
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

function removeVietnameseTones(str) {
  if (!str) return "";
  return str
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/đ/g, "d")
    .replace(/Đ/g, "D")
    .toLowerCase()
    .trim();
}

async function resolveImageFile(baseDir, relPath) {
  if (!baseDir || !relPath) return null;
  const normalizedRel = String(relPath).replace(/\\/g, "/").replace(/^\/+/, "");

  // 1. Kiểm tra trực tiếp đường dẫn gốc, NFC và NFD
  const candidates = [
    path.resolve(baseDir, normalizedRel),
    path.resolve(baseDir, normalizedRel.normalize("NFC")),
    path.resolve(baseDir, normalizedRel.normalize("NFD")),
  ];
  for (const c of candidates) {
    if (fs.existsSync(c)) return c;
  }

  // 2. Tìm kiếm từng cấp thư mục mềm dẻo (hỗ trợ lệch chữ hoa/thường, dấu cách, dấu tiếng Việt hoặc NFD/NFC)
  const segments = normalizedRel.split("/").filter(Boolean);
  let currentDir = baseDir;

  for (let i = 0; i < segments.length; i++) {
    const targetSegment = segments[i];

    let entries;
    try {
      entries = await fs.promises.readdir(currentDir);
    } catch {
      return null;
    }

    const targetNfc = targetSegment.normalize("NFC");
    const targetLower = targetNfc.toLowerCase();
    const targetTrimmed = targetLower.trim();
    const targetSlug = removeVietnameseTones(targetNfc);

    let matchedEntry = entries.find((e) => e.normalize("NFC") === targetNfc);
    if (!matchedEntry) {
      matchedEntry = entries.find((e) => e.normalize("NFC").toLowerCase() === targetLower);
    }
    if (!matchedEntry) {
      matchedEntry = entries.find((e) => e.normalize("NFC").toLowerCase().trim() === targetTrimmed);
    }
    if (!matchedEntry) {
      matchedEntry = entries.find((e) => removeVietnameseTones(e) === targetSlug);
    }

    if (!matchedEntry) return null;
    currentDir = path.join(currentDir, matchedEntry);
  }

  return fs.existsSync(currentDir) ? currentDir : null;
}

async function importImageFromRelativePath(relPath, csvDir, prefix = "img") {
  if (!relPath || !csvDir) return null;

  try {
    const fullSrcPath = await resolveImageFile(csvDir, relPath);
    if (!fullSrcPath) {
      console.warn(`[BatchImport] Ảnh không tồn tại tại: ${path.resolve(csvDir, relPath)} (từ đường dẫn: ${relPath})`);
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

async function pMap(items, iterator, concurrency = 5) {
  let index = 0;
  const results = new Array(items.length);
  const workers = new Array(Math.min(concurrency, items.length)).fill(0).map(async () => {
    while (index < items.length) {
      const currentIdx = index++;
      results[currentIdx] = await iterator(items[currentIdx], currentIdx);
    }
  });
  await Promise.all(workers);
  return results;
}

async function processSingleStory({
  storyGroup,
  storyIndex,
  totalStories,
  csvDir,
  validPosterId,
  nationsCache,
  imagesCache,
  usersCache,
  genresCache,
  authorsCache,
  importSessionId,
}) {
  const { title: storyTitle, rows } = storyGroup;
  const storyTitleKey = storyTitle.toLowerCase().trim();
  const nodesCache = new Map();
  const nodeContentsCache = new Map();
  const loadedNodesSet = new Set();

  let isNewStory = false;
  let isCoverUpdated = false;
  let importedNodesCount = 0;
  let importedContentsCount = 0;
  let story = null;

  console.log(`[BatchImport] ⏳ [Truyện ${storyIndex + 1}/${totalStories}] Bắt đầu xử lý: "${storyTitle}" (${rows.length} dòng dữ liệu)...`);

  try {
    for (let rIdx = 0; rIdx < rows.length; rIdx++) {
      const item = rows[rIdx];
      const { story: sData } = item;
      if (!sData || !sData.title) continue;

      if (!story) {
        story = await db.story.findUnique({
          where: { title: sData.title },
        });

        if (!story) {
          const resolvedNationId = await resolveNationId(sData.nation_id, sData.nation, nationsCache);
          let resolvedCoverArtId = await resolveImageId(sData.cover_art_id, imagesCache);

          if (!resolvedCoverArtId && sData.cover_art_path && csvDir) {
            resolvedCoverArtId = await importImageFromRelativePath(sData.cover_art_path, csvDir, `cover_${storyTitleKey.replace(/[^a-z0-9]/gi, "_")}`);
            if (resolvedCoverArtId) {
              isCoverUpdated = true;
              console.log(`[BatchImport] 🖼️ [Truyện ${storyIndex + 1}/${totalStories}] Đã import ảnh bìa cho truyện mới "${sData.title}"`);
            }
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
          isNewStory = true;
          console.log(`[BatchImport] ➕ [Truyện ${storyIndex + 1}/${totalStories}] Tạo thành công truyện mới: "${story.title}" (ID: ${story.id})`);
        } else {
          console.log(`[BatchImport] ℹ️ [Truyện ${storyIndex + 1}/${totalStories}] Truyện "${story.title}" đã tồn tại (ID: ${story.id})`);
          if (!story.cover_art_id && sData.cover_art_path && csvDir) {
            const newCoverId = await importImageFromRelativePath(sData.cover_art_path, csvDir, `cover_${story.id}`);
            if (newCoverId) {
              await db.story.update({
                where: { id: story.id },
                data: { cover_art_id: newCoverId },
              });
              story.cover_art_id = newCoverId;
              isCoverUpdated = true;
              console.log(`[BatchImport] 🖼️ [Truyện ${storyIndex + 1}/${totalStories}] Đã bổ sung ảnh bìa cho truyện "${story.title}"`);
            }
          }
        }
      }

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

      // Support dynamic N-level nodes
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
            loadedNodesSet.add(currentNode.id);
            console.log(
              `[BatchImport] ➕ [Truyện ${storyIndex + 1}/${totalStories}] Tạo node mới: "${currentNode.title || "Node #" + nodeOrder}" (Order: ${nodeOrder}, Type: ${currentNode.type}) cho truyện "${story.title}"`,
            );
          }

          nodesCache.set(nodeKey, currentNode);
        }

        // Nội dung của Node (nếu có)
        if (
          nodeData.content &&
          (nodeData.content.content || nodeData.content.image_id || nodeData.content.image_path || nodeData.content.order_index !== null)
        ) {
          const contentOrder = Number(nodeData.content.order_index ?? 1);
          let contentImageId = await resolveImageId(nodeData.content.image_id, imagesCache);
          if (!contentImageId && nodeData.content.image_path && csvDir) {
            contentImageId = await importImageFromRelativePath(nodeData.content.image_path, csvDir, `${story.id}_${currentNode.id}_${contentOrder}`);
          }

          // Kiểm tra và nạp cache toàn bộ content của Node nếu chưa nạp (tránh query DB nhiều lần)
          if (!loadedNodesSet.has(currentNode.id)) {
            const existingContents = await db.storyNodeContent.findMany({
              where: { story_node_id: currentNode.id },
            });
            for (const c of existingContents) {
              nodeContentsCache.set(`${currentNode.id}_${c.order_index}`, c);
            }
            loadedNodesSet.add(currentNode.id);
          }

          const contentKey = `${currentNode.id}_${contentOrder}`;
          const existingContent = nodeContentsCache.get(contentKey);

          if (existingContent) {
            // Cách 1: Ghi đè cập nhật nội dung/ảnh mới (không xóa record Image và file vật lý cũ)
            const updatedContent = await db.storyNodeContent.update({
              where: { id: existingContent.id },
              data: {
                type: nodeData.content.type || (contentImageId ? "image" : nodeData.content.content ? "text" : existingContent.type),
                content: nodeData.content.content !== undefined ? nodeData.content.content : existingContent.content,
                image_id: contentImageId !== null ? contentImageId : existingContent.image_id,
                deleted_status: nodeData.content.deleted_status || existingContent.deleted_status,
              },
            });
            nodeContentsCache.set(contentKey, updatedContent);
          } else {
            const newContent = await db.storyNodeContent.create({
              data: {
                story_node_id: currentNode.id,
                order_index: contentOrder,
                type: nodeData.content.type || (contentImageId ? "image" : "text"),
                content: nodeData.content.content || null,
                image_id: contentImageId,
                deleted_status: nodeData.content.deleted_status || "not_deleted",
              },
            });
            nodeContentsCache.set(contentKey, newContent);
            importedContentsCount++;
          }
        }

        currentParentId = currentNode.id;
      }
    }

    // Đồng bộ cây con (children tree) trực tiếp vào DB và trigger embedding cho truyện này ngay
    if (story) {
      try {
        await SyncStoryChildren(story.id, db);
        storyQueue.addJob_EmbeddingStory(story.id);
      } catch (err) {
        console.error(`[BatchImport] Lỗi kích hoạt post-import cho truyện ${story.id}:`, err);
      }
    }

    // Ghi nhận chi tiết vào bảng StoryImportItem
    if (importSessionId) {
      try {
        await db.storyImportItem.create({
          data: {
            session_id: importSessionId,
            story_id: story?.id || null,
            story_title: storyTitle,
            action: isNewStory ? "created" : "updated",
            new_nodes_count: importedNodesCount,
            new_contents_count: importedContentsCount,
            is_cover_updated: isCoverUpdated,
            status: "success",
          },
        });
      } catch (itemErr) {
        console.warn(`[BatchImport] Không thể lưu StoryImportItem cho truyện "${storyTitle}":`, itemErr.message);
      }
    }

    return {
      success: true,
      story,
      isNewStory,
      importedNodesCount,
      importedContentsCount,
    };
  } catch (storyError) {
    console.error(`[BatchImport] ❌ Lỗi xử lý truyện "${storyTitle}":`, storyError.message);
    if (importSessionId) {
      try {
        await db.storyImportItem.create({
          data: {
            session_id: importSessionId,
            story_id: story?.id || null,
            story_title: storyTitle,
            action: "failed",
            new_nodes_count: importedNodesCount,
            new_contents_count: importedContentsCount,
            is_cover_updated: isCoverUpdated,
            status: "failed",
            error_message: storyError.message,
          },
        });
      } catch {}
    }
    return {
      success: false,
      story: null,
      isNewStory: false,
      importedNodesCount: 0,
      importedContentsCount: 0,
      error: storyError,
    };
  }
}

export async function executeBatchImportRows({ rows = [], userId, fileName, csvDir, job, importSessionId }) {
  console.log(`[BatchImport] Bắt đầu import ${rows.length} dòng từ file ${fileName || "bảng tính"}${csvDir ? ` (Thư mục CSV: ${csvDir})` : ""}`);

  // 1. Gom nhóm các dòng dữ liệu theo tiêu đề truyện (story.title)
  const storyGroups = new Map();
  for (const row of rows) {
    const title = row?.story?.title;
    if (!title) continue;
    const key = title.toLowerCase().trim();
    if (!storyGroups.has(key)) {
      storyGroups.set(key, { title, rows: [] });
    }
    storyGroups.get(key).rows.push(row);
  }

  const storyList = Array.from(storyGroups.values());
  const totalStories = storyList.length;
  console.log(`[BatchImport] 📊 Phát hiện ${totalStories} truyện độc lập từ ${rows.length} dòng dữ liệu.`);

  if (importSessionId) {
    try {
      await db.storyImportSession.update({
        where: { id: importSessionId },
        data: {
          total_stories: totalStories,
          total_rows: rows.length,
          status: "processing",
        },
      });
    } catch {}
  }

  if (totalStories === 0) {
    console.warn(`[BatchImport] Không tìm thấy dữ liệu truyện hợp lệ nào để import.`);
    return { importedStoriesCount: 0, importedNodesCount: 0, importedContentsCount: 0 };
  }

  const nationsCache = new Map();
  const imagesCache = new Map();
  const usersCache = new Map();
  const genresCache = new Map();
  const authorsCache = new Map();
  const affectedStories = new Map();

  const validPosterId = await resolveUserId(userId, usersCache);

  let totalCreatedStories = 0;
  let totalUpdatedStories = 0;
  let totalImportedNodes = 0;
  let totalImportedContents = 0;
  let completedStoriesCount = 0;

  // Giới hạn số truyện xử lý song song cùng lúc (mặc định 5 truyện)
  const CONCURRENCY = Math.max(1, parseInt(process.env.BATCH_IMPORT_CONCURRENCY, 10) || 5);
  console.log(`[BatchImport] ⚡ Chạy song song với CONCURRENCY = ${CONCURRENCY} truyện cùng lúc.`);

  try {
    await pMap(
      storyList,
      async (storyGroup, storyIndex) => {
        const result = await processSingleStory({
          storyGroup,
          storyIndex,
          totalStories,
          csvDir,
          validPosterId,
          nationsCache,
          imagesCache,
          usersCache,
          genresCache,
          authorsCache,
          importSessionId,
        });

        if (result.story) {
          affectedStories.set(result.story.id, result.story);
        }
        if (result.isNewStory) {
          totalCreatedStories++;
        } else if (result.success) {
          totalUpdatedStories++;
        }
        totalImportedNodes += result.importedNodesCount;
        totalImportedContents += result.importedContentsCount;
        completedStoriesCount++;

        console.log(`[BatchImport] ✅ [Tiến độ: ${completedStoriesCount}/${totalStories} truyện] Đã xử lý truyện: "${storyGroup.title}"`);

        if (job && typeof job.updateProgress === "function") {
          await job.updateProgress({
            step: "importing_stories",
            current: completedStoriesCount,
            total: totalStories,
            currentStory: storyGroup.title,
            percentage: Math.round((completedStoriesCount / totalStories) * 100),
          });
        }

        // Cập nhật tiến độ vào StoryImportSession DB
        if (importSessionId) {
          try {
            const calculatedProgress = 25 + Math.round((completedStoriesCount / totalStories) * 70);
            await db.storyImportSession.update({
              where: { id: importSessionId },
              data: {
                processed_stories: completedStoriesCount,
                created_stories_count: totalCreatedStories,
                updated_stories_count: totalUpdatedStories,
                imported_nodes_count: totalImportedNodes,
                imported_contents_count: totalImportedContents,
                progress: calculatedProgress,
              },
            });
          } catch {}
        }
      },
      CONCURRENCY,
    );

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

    console.log(
      `[BatchImport] 🎉 Hoàn tất import toàn bộ: ${totalCreatedStories} truyện mới, ${totalUpdatedStories} truyện cập nhật, ${totalImportedNodes} nodes, ${totalImportedContents} contents.`,
    );
    return {
      importedStoriesCount: totalCreatedStories,
      updatedStoriesCount: totalUpdatedStories,
      importedNodesCount: totalImportedNodes,
      importedContentsCount: totalImportedContents,
    };
  } catch (error) {
    console.error(`[BatchImport] ❌ Lỗi xử lý import file ${fileName}:`, error);
    throw error;
  }
}

export const batchImportStoriesWorker = new Worker(
  "batch-import-stories",
  async (job) => {
    const { rows = [], userId, fileName, csvDir, sessionId } = job.data;
    let dbSession = null;
    if (sessionId) {
      try {
        dbSession = await db.storyImportSession.findUnique({
          where: { session_id: sessionId },
        });
      } catch {}
    }
    try {
      const res = await executeBatchImportRows({ rows, userId, fileName, csvDir, job, importSessionId: dbSession?.id });
      if (dbSession) {
        await db.storyImportSession
          .update({
            where: { id: dbSession.id },
            data: { status: "completed", progress: 100, completed_at: new Date() },
          })
          .catch(() => {});
      }
      return res;
    } catch (error) {
      if (dbSession) {
        await db.storyImportSession
          .update({
            where: { id: dbSession.id },
            data: { status: "failed", error_message: error?.message || String(error), completed_at: new Date() },
          })
          .catch(() => {});
      }
      throw error;
    }
  },
  { connection, concurrency: 1 },
);

batchImportStoriesWorker.on("failed", (job, err) => {
  console.error(`[BatchImport] ❌ Job ${job?.id} thất bại (Lần thử ${job?.attemptsMade}/${job?.opts?.attempts}):`, err?.message || err);
});

export const batchImportZipWorker = new Worker(
  "batch-import-zip",
  async (job) => {
    const { zipFilePath: initialZipFilePath, originalName, userId, sessionId, totalChunks, fileSize, cleanupAfterProcessing } = job.data;
    console.log(`[BatchImportZip] Bắt đầu xử lý import ZIP (Session: ${sessionId})`);

    const { uploadsDir, processingDir: rootProcessingDir } = getTempDir();
    let zipFilePath = initialZipFilePath;

    if (!zipFilePath && sessionId) {
      zipFilePath = path.join(uploadsDir, `${sessionId}.zip`);
    }

    const processingDir = path.join(rootProcessingDir, sessionId);

    // Tìm hoặc tạo StoryImportSession trong database
    let dbSession = null;
    if (sessionId) {
      try {
        dbSession = await db.storyImportSession.findUnique({
          where: { session_id: sessionId },
        });
        if (!dbSession) {
          dbSession = await db.storyImportSession.create({
            data: {
              session_id: sessionId,
              user_id: userId || null,
              source_type: "zip_upload",
              status: "pending",
              file_name: originalName || (zipFilePath ? path.basename(zipFilePath) : "archive.zip"),
              file_size: fileSize ? BigInt(fileSize) : null,
              started_at: new Date(),
            },
          });
        }
      } catch (err) {
        console.warn(`[BatchImportZip] Không thể khởi tạo dbSession:`, err.message);
      }
    }

    try {
      // 1. Ghép các chunks thành file zip duy nhất nếu chưa có file zip hoàn chỉnh
      if ((!zipFilePath || !fs.existsSync(zipFilePath)) && sessionId && totalChunks) {
        console.log(`[BatchImportZip] 🧩 [Bước 1/5] Bắt đầu ghép ${totalChunks} chunks cho session ${sessionId}...`);
        if (dbSession) {
          await db.storyImportSession
            .update({
              where: { id: dbSession.id },
              data: { status: "merging" },
            })
            .catch(() => {});
        }
        if (job && typeof job.updateProgress === "function") {
          await job.updateProgress({ step: "merging_chunks", current: 0, total: totalChunks });
        }

        await mergeChunksSequentially({
          sessionId,
          totalChunks,
          targetFilePath: zipFilePath,
          onProgress: async (current, total) => {
            console.log(`[BatchImportZip] 🧩 [Bước 1/5] Đã ghép chunk ${current}/${total}`);
            const mergeProgress = 5 + Math.round((current / total) * 15);
            if (dbSession) {
              await db.storyImportSession
                .update({
                  where: { id: dbSession.id },
                  data: { progress: mergeProgress },
                })
                .catch(() => {});
            }
            if (job && typeof job.updateProgress === "function") {
              await job.updateProgress({ step: "merging_chunks", current, total });
            }
          },
        });

        console.log(`[BatchImportZip] 🧩 [Bước 1/5] Ghép chunk hoàn tất: ${zipFilePath}`);
      } else {
        console.log(`[BatchImportZip] 🧩 [Bước 1/5] Đã có sẵn file ZIP tại: ${zipFilePath}`);
      }

      // 2. Giải nén vào thư mục processing
      console.log(`[BatchImportZip] 📦 [Bước 2/5] Đang giải nén file zip vào thư mục tạm...`);
      if (dbSession) {
        await db.storyImportSession
          .update({
            where: { id: dbSession.id },
            data: { status: "extracting", progress: 20 },
          })
          .catch(() => {});
      }
      await extractZipArchive(zipFilePath, processingDir);
      console.log(`[BatchImportZip] 📦 [Bước 2/5] Giải nén thành công.`);

      // 3. Tìm file CSV hoặc bảng tính bên trong thư mục giải nén
      console.log(`[BatchImportZip] 📄 [Bước 3/5] Đang tìm và đọc file bảng tính trong thư mục giải nén...`);
      const csvPath = await findCsvInDirectory(processingDir);
      if (!csvPath) {
        throw new Error("Không tìm thấy file .csv hoặc bảng tính hợp lệ trong file zip đã giải nén");
      }

      console.log(`[BatchImportZip] 📄 [Bước 3/5] Đã tìm thấy file bảng tính: ${csvPath}`);

      const csvBuffer = await fs.promises.readFile(csvPath);
      const rows = parseStoriesSpreadsheet(csvBuffer);

      if (!rows || rows.length === 0) {
        throw new Error("File bảng tính trong file zip không có dòng dữ liệu truyện hợp lệ nào");
      }

      console.log(`[BatchImportZip] 📄 [Bước 3/5] Đọc xong file bảng tính: tìm thấy ${rows.length} dòng dữ liệu.`);
      if (dbSession) {
        await db.storyImportSession
          .update({
            where: { id: dbSession.id },
            data: { status: "processing", total_rows: rows.length, progress: 25 },
          })
          .catch(() => {});
      }

      // 4. Thực thi import dữ liệu với đường dẫn thư mục CSV để resolve ảnh tương đối
      console.log(`[BatchImportZip] ⚙️ [Bước 4/5] Bắt đầu import dữ liệu (${rows.length} dòng)...`);
      const csvDir = path.dirname(csvPath);
      await executeBatchImportRows({
        rows,
        userId,
        fileName: originalName || path.basename(zipFilePath),
        csvDir,
        job,
        importSessionId: dbSession?.id,
      });

      // 5. Dọn dẹp hoặc chuyển file zip vào thư mục completed
      console.log(`[BatchImportZip] 🧹 [Bước 5/5] Đang dọn dẹp file tạm...`);
      await cleanupOrMoveProcessedZip({
        zipFilePath,
        processingDir,
        sessionId,
        cleanupAfterProcessing,
      });

      // Đảm bảo nâng version cache và reset khi toàn bộ file zip hoàn tất
      await redisUtils.stories().incr();
      await redisUtils.storyNodes().incr();

      if (dbSession) {
        await db.storyImportSession
          .update({
            where: { id: dbSession.id },
            data: { status: "completed", progress: 100, completed_at: new Date() },
          })
          .catch(() => {});
      }

      console.log(`[BatchImportZip] ✅ [Bước 5/5] Hoàn tất xử lý file zip (Session: ${sessionId})`);
    } catch (error) {
      console.error(`[BatchImportZip] ❌ Lỗi xử lý file zip (Session: ${sessionId}):`, error);
      if (dbSession) {
        await db.storyImportSession
          .update({
            where: { id: dbSession.id },
            data: { status: "failed", error_message: error?.message || String(error), completed_at: new Date() },
          })
          .catch(() => {});
      }
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
