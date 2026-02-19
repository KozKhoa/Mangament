import ErrorCodes from "../constants/Error.js";
import { CreateError } from "../utils/ErrorHandle.js";

import * as usersModel from "../models/User.Model.js";
import * as storiesModel from "../models/Story.Model.js";
import * as adminModel from "../models/AdminModel.js";
import * as historiesModel from "../models/History.Model.js";

import { ConvertQuery } from "../utils/QueryConvert.js";
import { ValidateGenre } from "../models/Genre.Model.js";
import {
  throwErrorIfInvalidGenders,
  throwErrorIfInvalidGenres,
  throwErrorIfInvalidRoles,
  throwErrorIfInvalidStoryStatus,
  throwErrorIfInvalidStoryType,
} from "../utils/Validators.js";

// GET /admin/dashboard/overview
export async function GetDashboardOverview(req, res, next) {
  try {
    const dashboardOverview = await adminModel.GetDashboardOverview();

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

    const viewByDate = await adminModel.GetDashboardViews({
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

    const newUsersByDate = adminModel.GetDashboardNewUsers({ fromDate, toDate, groupBy: groupBy });

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

    const users = await usersModel.FindAllUser({
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

    const user = await usersModel.FindUser({ id: userId });

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

    await usersModel.BannedUser({ id: userId, isBanned: isBanned });

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

    await usersModel.SoftDeleteUser({ id: userId });

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

    const update = await usersModel.UpdateUser({ id: userId, data: { role, name } });
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

    const story = await storiesModel.FindStory({ id: storyId });

    if (!story) throw CreateError();

    return res.json({ success: true, data: story.data });
  } catch (error) {
    next(error);
  }
}

// GET /admin/stories
export async function GetAllStories(req, res, next) {
  try {
    const { isGettingChildren, authors, keyword, isGettingNewestChapter, limit, status, page, type, genres, star, view, sort } = ConvertQuery(req.query);

    const stories = await storiesModel.FindAllStories({
      keyword: keyword,
      type: type,
      view: view,
      star: star,
      genres: genres,
      genres: genres,
      authorsId: authors,
      sort: sort,
      page: page,
      limit: limit,
      status: status,
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

// PUT /admin/stories/:id
export async function UpdateStory(req, res, next) {
  try {
    const storyId = req?.params?.id;

    const body = req?.body;

    const title = body?.title;
    const nation = body?.nation;
    const type = body?.type;
    const status = body?.status;
    const genre = body?.genre;
    const authorIds = body?.authorIds;
    const summary = body?.summary;
    const coverArtUrl = body?.coverArtUrl;
    const publicId = body?.publicId; // This is a public id for image in cloudinary

    throwErrorIfInvalidGenres(genre);
    throwErrorIfInvalidStoryStatus(status);
    throwErrorIfInvalidStoryType(type);

    const update = await storiesModel.UpdateStory(storyId, {
      title: title,
      type: type,
      summary: summary,
      nation: nation,
      status: status,
      genres: genre,
      authorIds: authorIds,
      coverArtUrl: coverArtUrl,
      publicId: publicId,
    });

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

    const active = await storiesModel.ActiveStory({ storyId: storyId, isActived: isActived });

    if (!active.success) throw CreateError();

    return res.json({ success: true, data: active.data });
  } catch (error) {
    next(error);
  }
}

// DELETE /admin/stories/:id
export async function DeleteStory(req, res, next) {
  try {
    const storyId = req.params.id;

    if (!storyId) throw CreateError(400, "'id' for story is required");

    const remove = await storiesModel.SoftDeleteStory({ id: storyId });
    if (!remove.success) throw CreateError();

    return res.json({ success: true, message: "Remove successfully" });
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
    const type = req.body?.type;
    const nation = req.body?.nation;
    const status = req.body?.status ?? "ongoing";
    const coverArtUrl = req.file?.path;
    const genres = req.body?.genre?.split(",");
    const authorIds = req.body?.authorIds?.split(",");

    if (!title || !type) throw CreateError(400, "'title' and 'type' are required");

    throwErrorIfInvalidGenres(genres);
    throwErrorIfInvalidStoryStatus(status);
    throwErrorIfInvalidStoryType(type);

    const newStory = await storiesModel.AddStory({
      title: title,
      type: type,
      nation: nation,
      genres: genres,
      status: status,
      posterId: userId,
      authorIds: authorIds,
      coverArtUrl: coverArtUrl,
    });

    if (!newStory) throw CreateError();

    return res.json({ success: true, data: newStory.data });
  } catch (error) {
    next(error);
  }
}
