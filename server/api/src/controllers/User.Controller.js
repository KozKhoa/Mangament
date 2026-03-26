import { UpdateUser } from "../services/user.service.js";

import { CreateError } from "../utils/ErrorHandle.js";
import { HashPassword, ComparePassword } from "../utils/Password.js";
import { throwErrorIfInvalidEmailAndPassword } from "../utils/Validators.js";

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

    // Get information need to be updated and validate them
    const name = req?.body?.name;
    const birthday = req?.body?.birthday ? new Date(req?.body?.birthday) : undefined;
    const avatar = req.body?.avatar;
    const gender = req.body?.gender;

    if (birthday == "Invalid Date") throw CreateError(400, "Invalid birthday format");

    // Update user infomation
    const updateUser = await userService.UpdateUser(userId, { name, birthday, gender, avatar });

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

export async function ChangeUserPassword(req, res, next) {
  try {
    const userId = req?.user?.id; // Get user id from authentication

    // Get information for request body
    const oldPassword = req?.body?.oldPassword;
    const newPassword = req?.body?.newPassword;

    // Check if missing password field
    if (!oldPassword || !newPassword) throw CreateError(400, "Missing password field");
    if (oldPassword === newPassword)
      // old and new password can not be the same
      throw CreateError(400, "Old password and new password cannot be the same");

    // Validate password format.
    throwErrorIfInvalidEmailAndPassword("example@gmail.com", newPassword);

    // Find user and password
    const user = await GetUserPassword({ id: userId });
    if (!user || !user.success)
      // Server error
      throw CreateError();
    if (!user.data) throw CreateError(404, "User not found"); // No user

    // Compare old password that user provide with password in database
    const isOldPasswordMatch = await ComparePassword(oldPassword, user.data.password);
    if (!isOldPasswordMatch) throw CreateError(400, "Invalid password");

    // Hashed new password and save it to database;
    const hashedPassword = await HashPassword(newPassword);
    const afterUpdate = await UpdateUser({ id: userId }, { password: hashedPassword });
    if (!afterUpdate || !afterUpdate.success) throw CreateError();

    return res.status(200).json({
      success: true,
      message: "Change password successfully",
      data: {
        user: {
          id: userId,
        },
      },
    });
  } catch (error) {
    next(error);
  }
}

export async function ChangeUserAvatar(req, res, next) {
  try {
    const userId = req.user.id;

    const updating = await UpdateUser({ id: userId }, { avatar: { connect: { id: image.data.id } } });

    delete updating.data.password;

    return res.status(200).json({
      success: true,
      message: "Update user avatar successfully",
      data: updating,
    });
  } catch (error) {
    next(error);
  }
}
