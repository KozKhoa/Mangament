import { FindAllUser, FindUser, UpdateUser, GetUserPassword, SoftDeleteUser } from "../models/User.Model.js";

import { AddImage, FindImage } from "../models/Image.Model.js";
import { CreateError } from "../utils/ErrorHandle.js";
import ErrorCodes from "../constants/Error.js";
import { ValidateGender } from "../models/Enum.Model.js";
import { HashPassword, ComparePassword } from "../utils/PasswordHandle.js";
import { CheckEmailAndPasswordFormat } from "../utils/Validators.js";
import { MoveFile } from "../utils/FileHandle.js";

import DIRECTORY from "../constants/Directory.js";
import path from "path";

export const GetUser = async (req, res, next) => {
  try {
    if (!req.params?.id) {
      req.params.id = req.user?.id;
    }

    const userId = req.params.id;
    // Check user request
    if (!userId) {
      throw CreateError(ErrorCodes.BAD_REQUEST);
    }
    const result = await FindUser({ id: userId }); // Check if user exist
    if (!result || !result.success || !result.data) {
      throw CreateError(ErrorCodes.USER_NOT_FOUND);
    }
    const user = result.data;

    // Get url of user avatar
    let avatar;
    if (user.avatar_id) {
      avatar = await FindImage({ id: user.avatar_id });
    }

    return res.status(200).json({
      success: true,
      message: "Get user info success",
      data: {
        id: user.id,
        name: user.name,
        email: user.email,
        gender: user.gender,
        join_date: user.join_date,
        role: user.role,
        birthday: user.birthday,
        ...(avatar &&
          avatar.success &&
          avatar.data && {
            avatar: {
              url: avatar.data.url,
              width: avatar.data.width,
              height: avatar.data.height,
            },
          }),
      },
    });
  } catch (error) {
    if (!error.status) console.error("❌ [User.Controller.js] Error getting user info:", error);
    next(error);
  }
};

export const GetAllUsers = async (req, res, next) => {
  try {
    const query = req?.query;
    if (!query) {
      throw CreateError(ErrorCodes.BAD_REQUEST);
    }

    // Analys the query from the user
    const limit = query?.limit ? Number(query?.limit) : 1;
    const page = query?.page ? Number(query.page) : 1;
    const order = {};

    if (query?.sort) {
      const [field, direction] = query.sort.split(":");
      order[field.toLowerCase()] = direction.toLowerCase();
    } else {
      order["join_date"] = "desc";
    }

    const users = await FindAllUser({}, order, limit, (page - 1) * limit);
    if (!users || !users.success) throw CreateError(ErrorCodes.INTERNAL_SERVER_ERROR);
    if (!users.data) throw CreateError(ErrorCodes.USER_NOT_FOUND);

    return res.status(200).json({
      success: true,
      message: "Get user list successfully",
      data: users.data,
    });
  } catch (error) {
    if (!error.status) console.error("❌ [User.Controller.js] Error getting all users:", error);
    next(error);
  }
};

export const PutUser = async (req, res, next) => {
  try {
    if (!req.params?.id) {
      req.params.id = req.user?.id;
    }
    const userId = req.params.id;

    if (!userId) {
      throw CreateError(ErrorCodes.BAD_REQUEST);
    }

    // Check if user exists
    const user = await FindUser({ id: userId });
    if (!user || !user.success) {
      throw CreateError(ErrorCodes.INTERNAL_SERVER_ERROR);
    }
    if (!user.data) {
      throw CreateError(ErrorCodes.USER_NOT_FOUND);
    }

    // Get information need to be updated and validate them
    const name = req?.body?.name;
    const birthday = req?.body?.birthday ? new Date(req?.body?.birthday) : null;
    if (birthday == "Invalid Date") {
      throw CreateError(ErrorCodes.INVALID_INPUT);
    }

    // Validate gender
    const gender = req?.body?.gender;
    if (!ValidateGender(gender)) {
      throw CreateError(ErrorCodes.INVALID_INPUT);
    }

    // Update user infomation
    const updateUser = await UpdateUser(
      { id: userId },
      {
        ...(name && { name }),
        ...(gender && { gender }),
        ...(birthday && { birthday }),
      }
    );
    if (!updateUser || !updateUser.success) {
      throw CreateError(ErrorCodes.INTERNAL_SERVER_ERROR);
    }

    return res.status(200).json({
      success: true,
      message: "Update user information successfully",
      data: {
        user: {
          id: updateUser.data.id,
          name: updateUser.data.name,
          gender: updateUser.data.gender,
          birthday: updateUser.data.birthday,
        },
      },
    });
  } catch (error) {
    if (!error.status) console.error("❌ [User.Controller.js] Error put user:", error);
    next(error);
  }
};

export async function PutUserPassword(req, res, next) {
  try {
    const userId = req?.user?.id; // Get user id from authentication
    // Get information for request body
    const oldPassword = req?.body?.oldPassword;
    const newPassword = req?.body?.newPassword;

    // Check if missing password field
    if (!oldPassword || !newPassword) throw CreateError(ErrorCodes.MISSING_FIELD);
    if (oldPassword === newPassword)
      // old and new password can not be the same
      throw CreateError(ErrorCodes.INVALID_INPUT);

    // Validate password format.
    CheckEmailAndPasswordFormat("example@gmail.com", newPassword);

    // Find user and password
    const user = await GetUserPassword({ id: userId });
    if (!user || !user.success)
      // Server error
      throw CreateError(ErrorCodes.INTERNAL_SERVER_ERROR);
    if (!user.data) throw CreateError(ErrorCodes.USER_NOT_FOUND); // No user

    // Compare old password that user provide with password in database
    const isOldPasswordMatch = await ComparePassword(oldPassword, user.data.password);
    if (!isOldPasswordMatch) throw CreateError(ErrorCodes.INVALID_PASSWORD);

    // Hashed new password and save it to database;
    const hashedPassword = await HashPassword(newPassword);
    const afterUpdate = await UpdateUser({ id: userId }, { password: hashedPassword });
    if (!afterUpdate || !afterUpdate.success) throw CreateError(ErrorCodes.INTERNAL_SERVER_ERROR);

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
    if (!error.status) console.error("❌ [User.Controller.js] Error change user password:", error);
    next(error);
  }
}

export async function PatchUserAvatar(req, res, next) {
  try {
    const userId = req.user.id;
    const avatar = req.file;
    if (!avatar) throw CreateError(ErrorCodes.MISSING_FIELD);

    const folderPath = DIRECTORY.UPLOADS_AVATAR;
    const fileName = userId + "_" + new Date() + path.extname(avatar.filename);
    const filePath = path.join(folderPath, fileName);

    MoveFile(avatar.path, filePath);
    const image = await AddImage({ url: filePath });

    const updating = await UpdateUser({ id: userId }, { avatar: { connect: { id: image.data.id } } });
    if (!updating || !updating.success) throw CreateError(ErrorCodes.INTERNAL_SERVER_ERROR);

    return res.status(200).json({
      success: true,
      message: "Update user avatar successfully",
      data: {
        user: {
          id: userId,
          avatar: {
            url: image.data.url,
            width: image.data.width,
            height: image.data.height,
          },
        },
      },
    });
  } catch (error) {
    next(error);
  }
}

export async function DeleteUser(req, res, next) {
  try {
    const userId = req.params?.id;
    if (!userId) throw CreateError(ErrorCodes.BAD_REQUEST);

    // Soft delete user already check user exist. If user is not found, its success return false
    // Soft delete user
    const softRemoveUser = await SoftDeleteUser({ id: userId });
    if (!softRemoveUser) throw CreateError(ErrorCodes.INTERNAL_SERVER_ERROR);
    if (!softRemoveUser.success) throw CreateError(ErrorCodes.USER_NOT_FOUND);

    return res.status(200).json({
      success: true,
      message: "Remove user successfully",
      data: {
        user: {
          id: userId,
        },
      },
    });
  } catch (error) {
    if (!error.status) console.error("❌ [User.Controller.js] Error delete user:", error);
    next(error);
  }
}
