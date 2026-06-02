import { CreateError } from "../../utils/ErrorHandle.js";

import * as userService from "../../services/user.service.js";

import { throwErrorIfInvalidRoles } from "../../utils/Validators.js";

// GET /admin/users
export async function getAllUsers(req, res, next) {
  try {
    const query = req.query;
    const { page, limit, gender, fromDate, toDate, role, isBanned, sort, search } = query;

    // throwErrorIfInvalidGenders(genders);
    // throwErrorIfInvalidRoles(roles);

    const users = await userService.FindAllUser({
      search: search,
      roles: role,
      genders: gender,
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
export async function getUser(req, res, next) {
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
export async function banUser(req, res, next) {
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
export async function deleteUser(req, res, next) {
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
export async function updateUserInfo(req, res, next) {
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
