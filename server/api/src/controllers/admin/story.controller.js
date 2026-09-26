import path from "path";
import { CreateError } from "../../utils/ErrorHandle.js";

import * as storyService from "../../services/story.service.js";
import * as chunkUploadService from "../../services/chunk-upload.service.js";

import { isUUID, throwErrorIfInvalidGenres, throwErrorIfInvalidStoryStatus, throwErrorIfInvalidStoryType } from "../../utils/Validators.js";
import { generateStoryImportTemplate } from "../../utils/spreadsheet.parser.js";
import { ZIP_CLEANUP_AFTER_PROCESSING } from "../../constants/Story.js";

// GET /admin/stories/:id
export async function getStory(req, res, next) {
  try {
    const storyId = req.params?.id;

    const query = req?.query;

    const { isGettingChildren, isGettingContent } = query;

    const isGettingTrashStoryNode = query.isGettingTrashStoryNode == "true" ? true : false;
    const isGettingTrashContent = query.isGettingTrashContent == "true" ? true : false;

    const story = await storyService.FindStory({
      id: storyId,
      isGettingChildren: isGettingChildren,
      isGettingContent: isGettingContent,
      isGettingTrashContents: isGettingTrashContent,
      isGettingTrashStoryNodes: isGettingTrashStoryNode,
    });

    if (!story) throw CreateError();

    return res.json({ success: true, data: story.data });
  } catch (error) {
    next(error);
  }
}

// GET /admin/stories
export async function getAllStories(req, res, next) {
  try {
    const { isGettingChildren, authors, keyword, isGettingNewestChapter, limit, status, page, type, genres, star, view, sort, nations } = req.query;

    const stories = await storyService.FindAllStories({
      keyword: keyword,
      type: type,
      view: view,
      star: star,
      genres: genres,
      authorsId: authors,
      sort: sort,
      page: page,
      nation: nations,
      limit: limit,
      status: status,
      deletedStatus: "not_deleted",
      isGettingChildren: isGettingChildren,
      isGettingNewestChapter: isGettingNewestChapter,
    });

    if (!stories || !stories.success) {
      throw CreateError();
    }

    return res.status(200).json({
      success: true,
      message: "Get story list successfully",
      data: stories.data,
      pagination: stories.pagination,
    });
  } catch (error) {
    next(error);
  }
}

// GET /admin/stories/import-template
export async function getStoryImportTemplate(req, res, next) {
  try {
    const format = String(req.query?.format || "xlsx").toLowerCase();
    const type = String(req.query?.type || "full").toLowerCase();

    const { buffer, mimeType, fileName } = generateStoryImportTemplate(type, format);

    res.setHeader("Content-Type", mimeType);
    res.setHeader("Content-Disposition", `attachment; filename="${fileName}"`);
    return res.send(buffer);
  } catch (error) {
    next(error);
  }
}

/**
 * POST /admin/stories/upload-zip
 * Tải file zip chứa bảng tính và các thư mục ảnh bìa / ảnh chapter lên diskStorage
 * và đẩy vào hàng đợi worker để giải nén và xử lý.
 */
export async function uploadBatchZipStory(req, res, next) {
  try {
    const userId = req.user?.id;
    const file = req.file;

    const cleanupAfterProcessing = ZIP_CLEANUP_AFTER_PROCESSING;

    const result = await storyService.ProcessUploadBatchZip({
      file,
      userId,
      cleanupAfterProcessing,
    });

    return res.status(200).json({
      success: true,
      message: "File zip đã được tải lên diskStorage thành công và đang được đưa vào worker giải nén, xử lý",
      data: result,
    });
  } catch (error) {
    next(error);
  }
}

/**
 * POST /admin/stories/download-zip
 * Tải file zip từ URL bên ngoài lưu trực tiếp vào diskStorage và đẩy vào worker xử lý.
 */
export async function downloadBatchZipStory(req, res, next) {
  try {
    const userId = req.user?.id;
    const { url } = req.body || {};

    const result = await storyService.ProcessDownloadBatchZip({
      url,
      userId,
      cleanupAfterProcessing: ZIP_CLEANUP_AFTER_PROCESSING,
    });

    return res.status(200).json({
      success: true,
      message: "File zip đã được tải về diskStorage thành công và đang được đưa vào worker giải nén, xử lý",
      data: result,
    });
  } catch (error) {
    next(error);
  }
}

/**
 * POST /admin/stories/upload-zip/chunk/init
 * Khởi tạo phiên tải lên theo chunk hoặc khôi phục phiên nếu cùng fileHash
 */
export async function initChunkUpload(req, res, next) {
  try {
    const userId = req.user?.id;
    const { fileName, fileSize, totalChunks, chunkSize, fileHash } = req.body || {};

    const result = await chunkUploadService.initChunkSession({
      fileName,
      fileSize,
      totalChunks,
      chunkSize,
      fileHash,
      userId,
      cleanupAfterProcessing: ZIP_CLEANUP_AFTER_PROCESSING,
    });

    return res.status(200).json({
      success: true,
      message: result.isResumed ? "Khôi phục phiên tải lên thành công" : "Khởi tạo phiên tải lên thành công",
      data: result,
    });
  } catch (error) {
    next(error);
  }
}

/**
 * GET /admin/stories/upload-zip/chunk/status
 * Lấy trạng thái phiên tải lên và danh sách các chunk đã tải
 */
export async function getChunkStatus(req, res, next) {
  try {
    const { sessionId } = req.query || {};

    const result = await chunkUploadService.getChunkStatus({ sessionId });

    return res.status(200).json({
      success: true,
      data: result,
    });
  } catch (error) {
    next(error);
  }
}

/**
 * POST /admin/stories/upload-zip/chunk/upload
 * Nhận một chunk nhị phân và lưu trữ trên đĩa
 */
export async function uploadChunk(req, res, next) {
  try {
    const { sessionId, chunkIndex } = req.body || {};
    const file = req.file;

    const result = await chunkUploadService.saveChunk({
      sessionId,
      chunkIndex,
      file,
    });

    return res.status(200).json({
      success: true,
      message: `Đã tải lên chunk ${result.chunkIndex} thành công`,
      data: result,
    });
  } catch (error) {
    next(error);
  }
}

/**
 * POST /admin/stories/upload-zip/chunk/complete
 * Ghép các chunk lại thành file ZIP hoàn chỉnh và đẩy vào worker xử lý
 */
export async function completeChunkUpload(req, res, next) {
  try {
    const userId = req.user?.id;
    const { sessionId } = req.body || {};

    const result = await chunkUploadService.completeChunkUpload({
      sessionId,
      userId,
      cleanupAfterProcessing: ZIP_CLEANUP_AFTER_PROCESSING,
    });

    return res.status(200).json({
      success: true,
      message: "Ghép các chunk thành file zip thành công và đã đưa vào worker giải nén, xử lý",
      data: result,
    });
  } catch (error) {
    next(error);
  }
}

/**
 * POST /admin/stories
 * Tạo truyện đơn lẻ hoặc import truyện hàng loạt từ file (.csv, .xlsx, .xls) hoặc .zip.
 *
 * - Batch Import: Gửi file qua multipart/form-data field `file`.
 *   Cấu trúc file, danh sách cột và ví dụ chi tiết: xem tại `docs/BATCH_IMPORT_GUIDE.md`.
 * - Single Story: Gửi JSON body với các trường thông tin truyện thông thường.
 */
export async function postNewStory(req, res, next) {
  try {
    const userId = req.user?.id;

    // Nếu người dùng tải lên file -> xử lý thêm truyện hàng loạt qua worker
    if (req.file) {
      const ext = path.extname(req.file.originalname || "").toLowerCase();

      // Nếu file là zip (được lưu vào diskStorage)
      if (ext === ".zip" || req.file.path) {
        const cleanupAfterProcessing = ZIP_CLEANUP_AFTER_PROCESSING;

        const result = await storyService.ProcessUploadBatchZip({
          file: req.file,
          userId,
          cleanupAfterProcessing,
        });

        return res.status(200).json({
          success: true,
          message: "File zip đã được tiếp nhận vào diskStorage và đang được xử lý thêm truyện trong worker",
          data: result,
        });
      }

      // File bảng tính thông thường trong bộ nhớ (.csv, .xlsx, .xls)
      const result = await storyService.ProcessBatchImportSpreadsheet({
        buffer: req.file.buffer,
        fileName: req.file.originalname,
        userId,
      });

      return res.status(200).json({
        success: true,
        message: "File đã được tiếp nhận và đang được xử lý thêm truyện hàng loạt trong worker",
        data: {
          fileName: result.fileName,
          totalRows: result.totalRows,
        },
      });
    }

    // Get information from body cho tạo truyện đơn lẻ
    const title = req.body?.title;
    const otherTitles = req?.body?.other_titles ?? [];
    const type = req.body?.type;
    const nation = req.body?.nation;
    const summary = req.body?.summary;
    const status = req.body?.status ?? "ongoing";
    const genres = req.body?.genre;
    const authorIds = req.body?.authorIds?.split(",");

    const coverArt = req.body.coverArt; // {url, key, id, public_id}

    if (!title || !type) throw CreateError(400, "'title' and 'type' are required");

    await throwErrorIfInvalidGenres(genres);
    throwErrorIfInvalidStoryStatus(status);
    throwErrorIfInvalidStoryType(type);

    const newStory = await storyService.AddStory({
      title: title,
      otherTitles: otherTitles,
      type: type,
      nation: nation,
      genres: genres,
      status: status,
      summary: summary,
      posterId: userId,
      authorIds: authorIds,
      coverArt: coverArt,
    });

    if (!newStory) throw CreateError();

    return res.json({ success: true, message: "Add new story successfully", data: newStory.data });
  } catch (error) {
    next(error);
  }
}

// PATCH /admin/stories/:id/cover-art
export async function updateStoryCoverArt(req, res, next) {
  try {
    const storyId = req?.params?.id;
    const coverArt = req.body?.coverArt; // {url, key, id, public_id}

    if (!storyId) throw CreateError(400, "'id' for story is required");

    const update = await storyService.UpdateStoryCoverArt(storyId, coverArt);
    if (!update) throw CreateError();

    return res.json({ success: true, message: "Update story cover art successfully", data: update.data });
  } catch (error) {
    next(error);
  }
}
// PUT /admin/stories/:id
export async function updateStory(req, res, next) {
  try {
    const user = req.user;

    const storyId = req?.params?.id;

    const body = req?.body;

    const title = body?.title;
    const otherTitles = body?.other_titles ?? [];
    const nation = body?.nation?.name;
    const type = body?.type;
    const status = body?.status;
    const genre = body?.genre;
    const authorIds = body?.authorIds;
    const summary = body?.summary ?? undefined;

    const coverArt = req.body?.coverArt ?? undefined; // {url, key, ...}

    const children = body.children;

    await throwErrorIfInvalidGenres(genre);
    throwErrorIfInvalidStoryStatus(status);
    throwErrorIfInvalidStoryType(type);

    const update = await storyService.UpdateStory(
      storyId,
      {
        title: title,
        otherTitles: otherTitles,
        type: type,
        summary: summary,
        nation: nation,
        status: status,
        genres: genre,
        authorIds: authorIds,
        coverArt: coverArt,
        children: children,
      },
      user.email,
    );

    return res.json({ success: true, message: "Update story successfully", data: update.data });
  } catch (error) {
    next(error);
  }
}

// PATCH /admin/stories/:id/active
export async function toggleActiveStory(req, res, next) {
  try {
    const storyId = req?.params?.id;
    const isActived = req.body?.isActived;

    if (!storyId) throw CreateError(400, "'id' for story is required");

    const active = await storyService.ActiveStory(storyId, isActived);

    if (!active.success) throw CreateError();

    return res.json({ success: true, data: active.data });
  } catch (error) {
    next(error);
  }
}

// DELETE /admin/stories/:id
// This is use for soft remove story
export async function deleteStory(req, res, next) {
  try {
    const storyId = req.params.id;

    if (!storyId) throw CreateError(400, "'id' for story is required");

    if (!isUUID(storyId)) throw CreateError(400, "'id' must be UUID");

    const remove = await storyService.ToggleSoftDeleteStory(storyId, "soft_deleted");
    if (!remove.success) throw CreateError();

    return res.json({ success: true, message: "Remove successfully" });
  } catch (error) {
    next(error);
  }
}

// GET /admin/stories/trash
export async function getAllTrashStories(req, res, next) {
  try {
    const page = Number(req.query?.page ?? 1);
    const limit = Number(req.query?.limit ?? 10);

    const trashStories = await storyService.FindAllStories({ page: page, limit: limit, deletedStatus: "soft_deleted" });

    res.json({ success: true, data: trashStories.data, pagination: trashStories.pagination });
  } catch (error) {
    next(error);
  }
}

// DELETE /admin/stories/trash/:id
// This is use to permanently remove story
export async function deleteTrashStory(req, res, next) {
  try {
    const storyId = req.params?.id;

    if (!storyId) throw CreateError(400, "'id' for image is required");

    await storyService.HardDeleteStory(storyId);

    return res.json({ success: true, message: "Remove successfully" });
  } catch (error) {
    next(error);
  }
}

// DELETE /admin/stories/trash
// This is use to permanently remove many stories
export async function deleteManyTrashStories(req, res, next) {
  try {
    const storyIds = req.body?.ids;

    if (!storyIds) throw CreateError(400, "'id' for image is required");

    await storyService.HardDeleteManyStories(storyIds);

    return res.json({ success: true, message: "Remove successfully" });
  } catch (error) {
    next(error);
  }
}

// PATCH /admin/stories/trash/restore
export async function restoreManyTrashStories(req, res, next) {
  try {
    const storyIds = req.body?.ids;

    const stories = await storyService.ToggleSoftDeleteManyStories(storyIds, "not_deleted"); // Restore

    res.json({ success: true, message: "Restore successfully", data: stories });
  } catch (error) {
    next(error);
  }
}

// PATCH /admin/stories/trash/:id/restore
export async function restoreTrashStory(req, res, next) {
  try {
    const storyId = req.params?.id;

    if (!isUUID(storyId)) throw CreateError(400, "'id' must be UUID");

    const story = await storyService.ToggleSoftDeleteStory(storyId, "not_deleted"); // Restore

    res.json({ success: true, message: "Restore successfully", data: story });
  } catch (error) {
    next(error);
  }
}
