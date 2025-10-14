import {
  FindAllUser,
  FindUser,
  FindReadingHistory,
  AddReadingHistory,
  UpdateUser,
} from "../models/User.Model.js";
import { FindImage } from "../models/Image.Model.js";
import { CreateError } from "../configs/ErrorHandle.js";
import ErrorCodes from "../constants/Error.js";

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
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
          gender: user.gender,
          join_date: user.join_date,
          role: user.role,
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
      },
    });
  } catch (error) {
    if (!error.status)
      console.error("❌ [User.Controller.js] Error getting user info:", error);
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

    if (!query?.orderBy) {
      query?.orderBy?.split(":").map(([field, direction]) => {
        order[field.toLowerCase()] = direction.toLowerCase();
      });
    } else {
      order["update_at"] = "desc";
    }
    const users = await FindAllUser({}, order, limit, (page - 1) * limit);

    return res.status(200).json({
      success: true,
      message: "Get user list successfully",
      data: users,
    });
  } catch (error) {
    if (!error.status)
      console.error("❌ [User.Controller.js] Error getting all users:", error);
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
    const gender = req?.body?.gender;
    let birthday = new Date(req?.body?.birthday);
    if (birthday == "Invalid Date") {
      throw CreateError(ErrorCodes.INVALID_INPUT);
    }

    // Update user infomation
    const updateUser = await UpdateUser(
      { id: userId },
      {
        name: name,
        gender: gender,
        birthday: birthday,
      }
    );
    if (!updateUser || !updateUser.success) {
      console.log(updateUser);
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
    if (!error.status)
      console.error("❌ [User.Controller.js] Error put user:", error);
    next(error);
  }
};

export async function GetReadingHistory(req, res, next) {
  try {
    let id;
    const query = req?.query;

    if (req.user.role === "admin") {
      id = req.params?.id || req.user.id;
    } else if (req?.params?.id === "mine") {
      id = req.user.id;
    } else if (req?.params?.id !== req.user.id) {
      throw CreateError(ErrorCodes.UNAUTHORIZED);
    }
    userId = req.user.id;

    // Analys the query from the user
    const userId = req.params?.userId || null;
    const limit = query?.limit ? Number(query.limit) : 1;
    const page = query?.page ? Number(query.page) : 1;
    const orderBy = {};
    if (query?.orderBy) {
      const [field, direction] = query.orderBy.split(":");
      orderBy[field.toLowerCase()] = direction.toLowerCase();
    } else {
      orderBy["create_at"] = "desc";
    }

    const readingHistory = await FindReadingHistory(
      { user_id: userId },
      limit,
      (page - 1) * limit,
      orderBy
    );

    if (!readingHistory || !readingHistory.success) {
      throw CreateError(ErrorCodes.INTERNAL_SERVER_ERROR);
    }

    return res.status(200).json({
      success: true,
      message: "Get reading history successfully",
      data: readingHistory.data,
    });
  } catch (error) {
    if (!error.status)
      console.error(
        "❌ [ReadingHistory.Controller.js] Error getting reading history:",
        error
      );
    next(error);
  }
}
