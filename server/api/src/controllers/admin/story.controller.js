import { CreateError } from "../../utils/ErrorHandle.js";

import * as storyService from "../../services/story.service.js";

import { isUUID, throwErrorIfInvalidGenres, throwErrorIfInvalidStoryStatus, throwErrorIfInvalidStoryType } from "../../utils/Validators.js";

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

// POST /admin/stories
export async function postNewStory(req, res, next) {
  try {
    // Get information from body
    const userId = req.user.id;

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
