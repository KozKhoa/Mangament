import { FindAllFavouriteStories, AddFavouriteStory, SoftDeleteFavouriteStory } from "../models/Favourite.Model.js";

import { CreateError } from "../utils/ErrorHandle.js";
import ErrorCodes from "../constants/Error.js";

import { ConvertQuery } from "../utils/QueryConvert.js";

export async function GetAllFavouriteStories(req, res, next) {
  try {
    // It is not neccessary to check user exist because authentication already did it
    const userId = req.user?.id;

    const { limit, page, sort, type, authors, genres, rating, view } = ConvertQuery(req.query);

    const favouriteStories = await FindAllFavouriteStories({
      userId: userId,
      limit: limit,
      page: page,
      storyType: type,
      sort: sort,
      star: rating,
      view: view,
      authorsId: authors,
      genres: genres,
    });

    if (!favouriteStories || !favouriteStories.success) throw CreateError(ErrorCodes.INTERNAL_SERVER_ERROR);

    favouriteStories.data.forEach((fav) => {
      fav.story.favourite = { id: fav.id };
    });

    return res.status(200).json({
      success: true,
      message: "Getting favourite stories successfully",
      data: favouriteStories.data,
    });
  } catch (error) {
    if (!error.status) console.error("❌ [User.Controller.js] Error getting user favourite story:", error);
    next(error);
  }
}

export async function PostFavouriteStory(req, res, next) {
  try {
    // It is not neccessary to check user exist because authentication already did it
    const userId = req.user?.id;
    const storyId = req.body?.storyId;

    if (!storyId) throw CreateError(ErrorCodes.MISSING_FIELD);

    const favouriteStory = await AddFavouriteStory({ userId: userId, storyId: storyId });
    if (!favouriteStory || !favouriteStory.success) throw CreateError(ErrorCodes.INTERNAL_SERVER_ERROR);

    delete favouriteStory.data.is_deleted;

    return res.status(200).json({
      success: true,
      message: "Add new favourite story successfully",
      data: favouriteStory.data,
    });
  } catch (error) {
    if (!error.status) console.error("❌ [User.Controller.js] Error posting user favourite story:", error);
    next(error);
  }
}

export async function DeleteFavouriteStory(req, res, next) {
  try {
    // It is not neccessary to check user exist because authentication already did it
    const userId = req.user?.id;

    const favouriteId = req.params?.id;

    if (!favouriteId) throw CreateError(ErrorCodes.BAD_REQUEST);

    const removing = await SoftDeleteFavouriteStory({ id: favouriteId, userId: userId });
    if (!removing || !removing.success) throw CreateError(removing.message || ErrorCodes.INTERNAL_SERVER_ERROR);

    return res.status(200).json({
      success: true,
      message: "Delete user favourite story successfully",
    });
  } catch (error) {
    if (!error.status) console.error("❌ [User.Controller.js] Error deleting user favourite story:", error);
    next(error);
  }
}
