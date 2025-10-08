import { FindAllUser, FindUser } from "../models/User.Model.js";
import { FindImage } from "../models/Image.Model.js";
import { CreateError } from "../configs/ErrorHandle.js";
import ErrorCodes from "../constants/Error.js";

export const GetUserInfo = async (req, res, next) => {
  try {
    if (!req?.params?.id || !req?.user?.id) {
      throw CreateError(ErrorCodes.UNAUTHORIZED);
    }
    if (req.params.id != req.user.id && req.user.role != "admin") {
      throw CreateError(ErrorCodes.UNAUTHORIZED);
    }
    const userId = req.params.id; // get user id added in authorization middleware

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

export const GetListUserInfo = async (req, res, next) => {
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
      order["update_at"] = "asc";
    }
    const users = await FindAllUser({}, order, limit, (page - 1) * limit);

    return res.status(200).json({
      success: true,
      message: "Get user list successfully",
      data: users.data,
    });
  } catch (error) {
    if (!error.status)
      console.error(
        "❌ [User.Controller.js] Error getting list of user info:",
        error
      );
    next(error);
  }
};
