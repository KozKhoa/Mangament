import { CreateError } from "../utils/ErrorHandle.js";

import * as userService from "../services/user.service.js";

// GET /user/me
export async function GetUser(req, res, next) {
  try {
    const userId = req.user?.id;

    const user = await userService.FindUser({ id: userId });

    delete user.data.password;

    return res.status(200).json({
      success: true,
      message: "Get user info success",
      data: user.data,
    });
  } catch (error) {
    next(error);
  }
}

export async function UpdateUserInfo(req, res, next) {
  try {
    const userId = req.user?.id;

    if (!userId) throw CreateError(400, "'id' for user is required");

    const { name, birthday, avatar, gender } = req.body;

    // Update user infomation
    const updateUser = await userService.UpdateUser(userId, { name, birthday, gender, avatar });

    console.log(avatar);

    delete updateUser.data.password;

    return res.status(200).json({
      success: true,
      message: "Update user information successfully",
      data: updateUser.data,
    });
  } catch (error) {
    next(error);
  }
}
