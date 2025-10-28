import {
  FindAllFavouriteStories,
  AddFavouriteStory,
  SoftDeleteFavouriteStory,
} from "../models/Favourite.Model.js";

import { CreateError } from "../utils/ErrorHandle.js";
import ErrorCodes from "../constants/Error.js";
import { FindStory } from "../models/Story.Model.js";

export async function GetAllFavouriteStories(req, res, next) {
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
      order["created_at"] = "desc";
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
      data: favouriteStories.data,
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
