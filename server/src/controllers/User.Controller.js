import {
  FindAllUser,
  FindUser,
  FindAllReadingHistories,
  AddReadingHistory,
  UpdateUser,
  GetUserPassword,
  SoftDeleteUser,
  FindAllFavouriteStories,
  AddFavouriteStory,
  SoftDeleteFavouriteStory,
  SoftDeleteReadingHistory,
} from "../models/User.Model.js";
import { FindImage } from "../models/Image.Model.js";
import { CreateError } from "../configs/ErrorHandle.js";
import ErrorCodes from "../constants/Error.js";
import { ValidateGender } from "../models/Enum.Model.js";
import { HashPassword, ComparePassword } from "../configs/PasswordHandle.js";
import { CheckEmailAndPasswordFormat } from "../utils/Validators.js";
import { FindStory, FindStoryNode } from "../models/Story.Model.js";

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

    if (query?.sort) {
      const [field, direction] = query.sort.split(":");
      order[field.toLowerCase()] = direction.toLowerCase();
    } else {
      order["join_date"] = "desc";
    }

    const users = await FindAllUser({}, order, limit, (page - 1) * limit);
    if (!users || !users.success)
      throw CreateError(ErrorCodes.INTERNAL_SERVER_ERROR);
    if (!users.data) throw CreateError(ErrorCodes.USER_NOT_FOUND);

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
    const birthday = new Date(req?.body?.birthday);
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

export async function PutUserPassword(req, res, next) {
  try {
    const userId = req?.user?.id; // Get user id from authentication
    // Get information for request body
    const oldPassword = req?.body?.oldPassword;
    const newPassword = req?.body?.newPassword;

    // Check if missing password field
    if (!oldPassword || !newPassword)
      throw CreateError(ErrorCodes.MISSING_FIELD);
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
    const isOldPasswordMatch = await ComparePassword(
      oldPassword,
      user.data.password
    );
    if (!isOldPasswordMatch) throw CreateError(ErrorCodes.INVALID_PASSWORD);

    // Hashed new password and save it to database;
    const hashedPassword = await HashPassword(newPassword);
    const afterUpdate = await UpdateUser(
      { id: userId },
      { password: hashedPassword }
    );
    if (!afterUpdate || !afterUpdate.success)
      throw CreateError(ErrorCodes.INTERNAL_SERVER_ERROR);

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
    if (!error.status)
      console.error(
        "❌ [User.Controller.js] Error change user password:",
        error
      );
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
    if (!error.status)
      console.error("❌ [User.Controller.js] Error delete user:", error);
    next(error);
  }
}

export async function GetFavouriteStories(req, res, next) {
  try {
    // It is not neccessary to check user exist because authentication already did it
    const userId = req.user?.id;
    const query = req?.query;

    const limit = query?.limit ? Number(query.limit) : 1;
    const page = query?.page ? Number(query.page) : 1;
    const order = {};
    if (query?.sort) {
      const [field, direction] = query.sort.split(":");
      order[field.toLowerCase()] = direction.toLowerCase();
    } else {
      order["create_at"] = "desc";
    }

    const favouriteStories = await FindAllFavouriteStories(
      { user_id: userId },
      order,
      limit,
      (page - 1) * limit
    );
    if (!favouriteStories || !favouriteStories.success)
      throw CreateError(ErrorCodes.INTERNAL_SERVER_ERROR);
    if (!favouriteStories.data || favouriteStories.data.length <= 0) {
      return res.status(200).json({
        success: true,
        message: "User has no favourite stories",
        data: null,
      });
    }

    return res.status(200).json({
      success: true,
      message: "Getting favourite stories successfully",
      data: favouriteStories,
    });
  } catch (error) {
    if (!error.status)
      console.error(
        "❌ [User.Controller.js] Error getting user favourite story:",
        error
      );
    next(error);
  }
}

export async function PostFavouriteStory(req, res, next) {
  try {
    // It is not neccessary to check user exist because authentication already did it
    const userId = req.user?.id;
    const storyId = req.body?.storyId;
    if (!storyId) throw CreateError(ErrorCodes.MISSING_FIELD);

    // Check if the story exist
    const story = await FindStory({ id: storyId });
    if (!story || !story.success || !story.data)
      throw CreateError(ErrorCodes.STORY_NOT_FOUND);

    const favouriteStory = await AddFavouriteStory({
      user_id: userId,
      story_id: storyId,
    });
    if (!favouriteStory || !favouriteStory.success)
      if (favouriteStory.error == "P2002")
        throw CreateError(ErrorCodes.ASSET_ALREADY_EXIST);
      else throw CreateError(ErrorCodes.INTERNAL_SERVER_ERROR);

    return res.status(200).json({
      success: true,
      message: "Add new favourite story successfully",
      data: {
        favourite: {
          id: favouriteStory.data.id,
        },
        user: {
          id: userId,
        },
        story: {
          id: storyId,
        },
      },
    });
  } catch (error) {
    if (!error.status)
      console.error(
        "❌ [User.Controller.js] Error posting user favourite story:",
        error
      );
    next(error);
  }
}

export async function DeleteFavouriteStory(req, res, next) {
  try {
    // It is not neccessary to check user exist because authentication already did it
    const userId = req.user?.id;

    const favouriteId = req.params?.favouriteId;
    if (!favouriteId) throw CreateError(ErrorCodes.BAD_REQUEST);

    // Check if the favourite story exist
    const favouriteStory = await FindAllFavouriteStories({ id: favouriteId });
    if (
      !favouriteStory ||
      !favouriteStory.success ||
      favouriteStory.data.length <= 0
    )
      throw CreateError(ErrorCodes.ASSET_NOT_FOUND);

    // Check if this favourite story belong to the user
    if (favouriteStory.data[0].user_id !== userId)
      throw CreateError(ErrorCodes.FORBIDDEN);

    const removing = await SoftDeleteFavouriteStory({ id: favouriteId });
    if (!removing || !removing.success)
      throw CreateError(ErrorCodes.INTERNAL_SERVER_ERROR);

    return res.status(200).json({
      success: true,
      message: "Delete user favourite story successfully",
    });
  } catch (error) {
    if (!error.status)
      console.error(
        "❌ [User.Controller.js] Error deleting user favourite story:",
        error
      );
    next(error);
  }
}

export async function GetReadingHistories(req, res, next) {
  try {
    // It is not neccessary to check user exist because authentication already did it
    const userId = req.user?.id;
    const query = req.query;

    // Analys the query from the user
    const limit = query?.limit ? Number(query.limit) : 1;
    const page = query?.page ? Number(query.page) : 1;
    const order = {};
    if (query?.sort) {
      const [field, direction] = query.sort.split(":");
      order[field.toLowerCase()] = direction.toLowerCase();
    } else {
      order["create_at"] = "desc";
    }

    const readingHistory = await FindAllReadingHistories(
      { user_id: userId },
      limit,
      (page - 1) * limit,
      order
    );

    if (!readingHistory || !readingHistory.success)
      throw CreateError(ErrorCodes.INTERNAL_SERVER_ERROR);
    if (!readingHistory.data || readingHistory.data.length <= 0) {
      return res.status(200).json({
        success: true,
        message: "User has no reading history",
        data: null,
      });
    }

    return res.status(200).json({
      success: true,
      message: "Get reading history successfully",
      data: readingHistory.data,
    });
  } catch (error) {
    if (!error.status)
      console.error(
        "❌ [ReadingHistory.Controller.js] Error getting reading histories:",
        error
      );
    next(error);
  }
}

export async function PostReadingHistory(req, res, next) {
  try {
    const userId = req.user?.id;
    const storyId = req.body?.storyId;
    const storyNodeId = req.body?.storyNodeId;
    const datetime = req.body?.dateTime
      ? new Date(req.body.dateTime)
      : new Date();

    // Position will be added later

    // Make sure story and story node exist
    const story = await FindStory({ id: storyId });
    if (!story || !story.success || !story.data)
      throw CreateError(ErrorCodes.STORY_NOT_FOUND);
    const storyNode = await FindStoryNode({ id: storyNodeId });
    if (!storyNode || !storyNode.success || !storyNode.data)
      throw CreateError(ErrorCodes.STORY_NODE_NOT_FOUND);

    const histories = await AddReadingHistory({
      user_id: userId,
      story_id: storyId,
      story_node_id: storyNodeId,
      create_at: datetime,
    });

    if (!histories || !histories.success)
      throw CreateError(ErrorCodes.INTERNAL_SERVER_ERROR);

    return res.status(200).json({
      success: true,
      message: "Adding reading history successfully",
      data: {
        history: { id: histories.data.id },
        user: { id: histories.data.user_id },
        story: { id: histories.data.story_id },
        story_node: { id: histories.data.story_node_id },
        create_at: histories.data.create_at,
      },
    });
  } catch (error) {
    if (!error.status)
      console.error(
        "❌ [ReadingHistory.Controller.js] Error posting reading history:",
        error
      );
    next(error);
  }
}

export async function DeleteReadingHistory(req, res, next) {
  try {
    const userId = req.user?.id;
    const historyId = req.params?.historyId;

    if (!historyId) throw CreateError(ErrorCodes.BAD_REQUEST);

    // Make sure history exist
    const history = await FindAllReadingHistories({ id: historyId });
    if (!history || !history.success || history.data.length <= 0)
      throw CreateError(ErrorCodes.ASSET_NOT_FOUND);

    // Make sure reading history belong to user
    if (history.data[0].user_id !== userId)
      throw CreateError(ErrorCodes.FORBIDDEN);

    const removing = await SoftDeleteReadingHistory({ id: historyId });
    if (!removing || !removing.success)
      throw CreateError(ErrorCodes.INTERNAL_SERVER_ERROR);

    return res.status(200).json({
      success: true,
      message: "Delete reading history successfully",
    });
  } catch (error) {
    if (!error.status)
      console.error(
        "❌ [ReadingHistory.Controller.js] Error deleting reading history:",
        error
      );
    next(error);
  }
}
