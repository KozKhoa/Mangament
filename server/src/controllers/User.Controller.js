import { FindUser } from "../models/User.Model.js";
import { FindImage } from "../models/Image.Model.js";
import { CreateError } from "../configs/ErrorHandle.js";
import ErrorCodes from "../constants/Error.js";

export const GetUserInfo = async (req, res, next) => {
  try {
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
    console.error("❌ [User.Controller.js] Error getting user info:", error);
    next(error);
  }
};
