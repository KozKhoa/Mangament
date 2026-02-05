import ErrorCodes from "../constants/Error.js";
import { CreateError } from "../utils/ErrorHandle.js";

import * as usersModel from "../models/User.Model.js";
import * as storiesModel from "../models/Story.Model.js";
import * as adminModel from "../models/AdminModel.js";
import * as historiesModel from "../models/History.Model.js";

import { ConvertQuery } from "../utils/QueryConvert.js";
import { ValidateGenre } from "../models/Genre.Model.js";
import { throwErrorIfInvalidGenders, throwErrorIfInvalidRoles } from "../utils/Validators.js";

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

    return res.json({ success: true, message: "Update user successfully", data: update });
  } catch (error) {
    next(error);
  }
}
