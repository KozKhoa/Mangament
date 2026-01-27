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
    let { fromDate, toDate } = ConvertQuery(req.query);

    const storyId = req.query?.storyId;

    if (!fromDate && !toDate) {
      toDate = new Date();

      fromDate = new Date();
      fromDate.setDate(fromDate.getDate() - 7);
    }

    fromDate?.setHours(0, 0, 0, 0);
    toDate?.setHours(0, 0, 0, 0);

    const viewByDate = await adminModel.GetDashboardViewByDate({ storyId: storyId, fromDate: fromDate, toDate: toDate });

    return res.json({ success: true, data: viewByDate.data });
  } catch (error) {
    next(error);
  }
}

// GET /admin/dashboard/stats/new-users
export async function GetDashboardNewUsers(req, res, next) {
  try {
    let { fromDate, toDate } = ConvertQuery(req.query);

    if (!fromDate && !toDate) {
      toDate = new Date();

      fromDate = new Date();
      fromDate.setDate(fromDate.getDate() - 7);
    }

    fromDate?.setHours(0, 0, 0, 0);
    toDate?.setHours(0, 0, 0, 0);
  } catch (error) {
    next(error);
  }
}

export async function GetAllUsers(req, res, next) {
  try {
    const { page, limit, genders, fromDate, toDate, roles, isBanned } = ConvertQuery(req.query);

    throwErrorIfInvalidGenders(genders);
    throwErrorIfInvalidRoles(roles);

    const users = await usersModel.FindAllUser({
      roles: roles,
      genders: ValidateGenre(genders),
      page: page,
      limit: limit,
      fromDate: fromDate,
      toDate: toDate,
      isBanned: isBanned,
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

    if (!userId) throw CreateError(400, "'id' is required");

    await usersModel.BannedUser({ id: userId });

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
