import { CreateError } from "../utils/ErrorHandle.js";

import * as userService from "../services/user.service.js";
import * as storyService from "../services/story.service.js";
import * as adminService from "../services/admin.service.js";
import * as imageService from "../services/image.service.js";
import * as storyNodeService from "../services/story-node.service.js";

import { ConvertQuery } from "../utils/QueryConvert.js";

import {
  isUUID,
  throwErrorIfInvalidGenders,
  throwErrorIfInvalidGenres,
  throwErrorIfInvalidRoles,
  throwErrorIfInvalidStoryStatus,
  throwErrorIfInvalidStoryType,
} from "../utils/Validators.js";

// GET /admin/dashboard/overview
export async function GetDashboardOverview(req, res, next) {
  try {
    const dashboardOverview = await adminService.GetDashboardOverview();

    return res.json({
      success: true,
      message: "Get admin dashboard successfully",
      data: dashboardOverview.data,
    });
  } catch (error) {
    next(error);
  }
}

// GET /admin/dashboard/stats/views
export async function GetDashboardViewInRange(req, res, next) {
  try {
    let { fromDate, toDate, groupBy } = ConvertQuery(req.query);

    const storyId = req.query?.storyId;
    const storyNodeId = req.query?.storyNodeId;

    if (!fromDate && !toDate) {
      toDate = new Date();

      fromDate = new Date();
      fromDate.setDate(fromDate.getDate() - 7);
    }

    fromDate?.setUTCHours(0, 0, 0, 0);
    toDate?.setUTCHours(23, 59, 59, 999);

    const viewByDate = await adminService.GetDashboardViews({
      storyId: storyId,
      storyNodeId: storyNodeId,
      fromDate: fromDate,
      toDate: toDate,
      groupBy: groupBy,
    });

    return res.json({ success: true, data: viewByDate.data });
  } catch (error) {
    next(error);
  }
}

// GET /admin/dashboard/stats/new-users
export async function GetDashboardNewUsers(req, res, next) {
  try {
    let { fromDate, toDate, groupBy } = ConvertQuery(req.query);

    if (!fromDate && !toDate) {
      toDate = new Date();

      fromDate = new Date();
      fromDate.setDate(fromDate.getDate() - 7);
    }
    fromDate?.setUTCHours(0, 0, 0, 0);
    toDate?.setUTCHours(23, 59, 59, 999);

    const newUsersByDate = adminService.GetDashboardNewUsers({ fromDate, toDate, groupBy: groupBy });

    return res.json({ success: true, data: (await newUsersByDate).data });
  } catch (error) {
    next(error);
  }
}

// GET /admin/users
export async function GetAllUsers(req, res, next) {
  try {
    const query = req.query;
    const { page, limit, genders, fromDate, toDate, roles, isBanned } = ConvertQuery(query);

    const search = query.search ?? "";

    const sort = {};
    if (query?.sort) {
      const [field, direction] = query.sort.split(":");
      sort[field.toLowerCase()] = direction.toLowerCase();
    } else {
      sort["join_date"] = "desc";
    }

    throwErrorIfInvalidGenders(genders);
    throwErrorIfInvalidRoles(roles);

    const users = await userService.FindAllUser({
      search: search,
      roles: roles,
      genders: genders,
      page: page,
      limit: limit,
      fromDate: fromDate,
      toDate: toDate,
      isBanned: isBanned,
      sort: sort,
    });

    if (!users) throw CreateError();

    return res.json({ success: true, message: "Get users successfully", data: users.data, pagination: users.pagination });
  } catch (error) {
    next(error);
  }
}

// GET /admin/users/:id
export async function GetUser(req, res, next) {
  try {
    const userId = req.params?.id;

    if (!userId) throw CreateError(400, "'id' is required");

    const user = await userService.FindUser({ id: userId });

    if (!user) throw CreateError();

    delete user.data?.password;

    return res.json({ success: true, message: "Get user information successfully", data: user.data });
  } catch (error) {
    next(error);
  }
}

// PATCH /admin/users/:id/ban
export async function BanUser(req, res, next) {
  try {
    const userId = req.params?.id;

    const isBanned = req.body?.isBanned;

    if (!userId) throw CreateError(400, "'id' is required");

    await userService.BannedUser({ id: userId, isBanned: isBanned });

    return res.json({ success: true, message: `Banned ${userId}` });
  } catch (error) {
    next(error);
  }
}

// DELETE /admin/users/:id
export async function DeleteUser(req, res, next) {
  try {
    const userId = req.params?.id;

    if (!userId) throw CreateError(400, "'id' is required");

    await userService.SoftDeleteUser({ id: userId });

    return res.json({ success: true, message: `Delete user ${userId}` });
  } catch (error) {
    next(error);
  }
}

// PUT /admin/users/:id
export async function UpdateUserInfo(req, res, next) {
  try {
    const userId = req.params?.id;

    const role = req.body?.role;
    const name = req.body?.name;

    throwErrorIfInvalidRoles(role);

    if (!userId) throw CreateError(400, "'id' is required");

    const update = await userService.UpdateUser(userId, { role, name });
    if (!update) throw CreateError();

    delete update?.data?.password;

    return res.json({ success: true, message: "Update user successfully", data: update.data });
  } catch (error) {
    next(error);
  }
}

// GET /admin/stories/:id
export async function GetStory(req, res, next) {
  try {
    const storyId = req.params?.id;

    const query = req?.query;

    const { isGettingChildren, isGettingContent } = ConvertQuery(query);

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
export async function GetAllStories(req, res, next) {
  try {
    const { isGettingChildren, authors, keyword, isGettingNewestChapter, limit, status, page, type, genres, star, view, sort, nations } = ConvertQuery(
      req.query,
    );

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
export async function PostNewStory(req, res, next) {
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

    throwErrorIfInvalidGenres(genres);
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
export async function UpdateStoryCoverArt(req, res, next) {
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
export async function UpdateStory(req, res, next) {
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
    const summary = body?.summary;

    const coverArt = req.body?.coverArt; // {url, key, ...}

    const children = body.children;

    throwErrorIfInvalidGenres(genre);
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
export async function ToggleActiveStory(req, res, next) {
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
export async function DeleteStory(req, res, next) {
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

// GET /admin/images/trash
export async function GetAllTrashImages(req, res, next) {
  try {
    const page = Number(req.query?.page ?? 1);
    const limit = Number(req.query?.limit ?? 10);

    const trashImage = await imageService.FindTrashImage({ page, limit });

    res.json({ success: true, data: trashImage.data, pagination: trashImage.pagination });
  } catch (error) {
    next(error);
  }
}

// DELETE /admin/images/trash
export async function DeleteManyTrashImages(req, res, next) {
  try {
    const imageIds = req.body?.ids;

    if (!imageIds) throw CreateError(400, "'id' for image is required");

    await imageService.HardDeleteManyImages({ ids: imageIds });

    return res.json({ success: true, message: "Remove successfully" });
  } catch (error) {
    next(error);
  }
}

// DELETE /admin/images/trash/:id
export async function DeleteTrashImage(req, res, next) {
  try {
    const imageId = req.params?.id;

    if (!imageId) throw CreateError(400, "'id' for image is required");

    await imageService.HardDeleteImage({ id: imageId });

    return res.json({ success: true, message: "Remove successfully" });
  } catch (error) {
    next(error);
  }
}

// GET /admin/stories/trash
export async function GetAllTrashStories(req, res, next) {
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
export async function DeleteTrashStory(req, res, next) {
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
export async function DeleteManyTrashStories(req, res, next) {
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
export async function RestoreManyTrashStories(req, res, next) {
  try {
    const storyIds = req.body?.ids;

    const stories = await storyService.ToggleSoftDeleteManyStories(storyIds, "not_deleted"); // Restore

    res.json({ success: true, message: "Restore successfully", data: stories });
  } catch (error) {
    next(error);
  }
}

// PATCH /admin/stories/trash/:id/restore
export async function RestoreTrashStory(req, res, next) {
  try {
    const storyId = req.params?.id;

    if (!isUUID(storyId)) throw CreateError(400, "'id' must be UUID");

    const story = await storyService.ToggleSoftDeleteStory(storyId, "not_deleted"); // Restore

    res.json({ success: true, message: "Restore successfully", data: story });
  } catch (error) {
    next(error);
  }
}

// DELETE /admin/story-nodes/trash/:id
// This is use to permanently remove story node
export async function DeletePermanentlyTrashStoryNode(req, res, next) {
  try {
    const storyNodeId = req.params?.id;

    if (!storyNodeId) throw CreateError(400, "'id' for story node is required");

    await storyNodeService.PermanentlyDeleteStoryNodeTrash(storyNodeId);

    return res.json({ success: true, message: "Remove successfully" });
  } catch (error) {
    next(error);
  }
}

// DELETE /admin/story-nodes/trash
// This is use to permanently remove many story nodes
export async function DeletePermanentlyManyTrashStoryNodes(req, res, next) {
  try {
    const storyNodeIds = req.body?.ids;

    if (!storyNodeIds || storyNodeIds.length === 0) throw CreateError(400, "Ids are required");

    await storyNodeService.PermanentlyDeleteManyStoryNodesTrash(storyNodeIds);

    return res.json({ success: true, message: "Remove successfully" });
  } catch (error) {
    next(error);
  }
}

//PATCH /admin/story-nodes/trash/:id/restore
// This is use to restore story node
export async function RestoreTrashStoryNode(req, res, next) {
  try {
    const storyNodeId = req.params?.id;

    if (!storyNodeId) throw CreateError(400, "'id' for story node is required");

    await storyNodeService.ToggleSoftDeleteStoryNode(storyNodeId, "not_deleted");

    return res.json({ success: true, message: "Restore successfully" });
  } catch (error) {
    next(error);
  }
}

// PATCH /admin/story-nodes/trash/restore
export async function RestoreManyTrashStoryNodes(req, res, next) {
  try {
    const storyNodeIds = req.body?.ids;

    if (!storyNodeIds) throw CreateError(400, "'id' for story node is required");

    await storyNodeService.ToggleSoftDeleteManyStoryNodes(storyNodeIds, "not_deleted");

    return res.json({ success: true, message: "Restore successfully" });
  } catch (error) {
    next(error);
  }
}

// GET /admin/story-nodes/trash
export async function GetAllStoryNodesTrash(req, res, next) {
  try {
    const page = Number(req.query?.page ?? 1);
    const limit = Number(req.query?.limit ?? 10);
    const storyId = req.query?.storyId;
    const parentId = req.query?.parentId;

    const result = await storyNodeService.FindAllStoryNodesTrash({ storyId, parentId, page, limit });

    if (!result.success) throw CreateError();

    return res.json({ success: true, message: "Get story nodes trash successfully", data: result.data || [], pagination: result.pagination });
  } catch (error) {
    next(error);
  }
}
