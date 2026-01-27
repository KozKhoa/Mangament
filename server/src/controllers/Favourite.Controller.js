import { FindAllFavouriteStories, AddFavouriteStory, SoftDeleteFavouriteStory } from "../models/Favourite.Model.js";

import { CreateError } from "../utils/ErrorHandle.js";
import ErrorCodes from "../constants/Error.js";

import { ConvertQuery } from "../utils/QueryConvert.js";

export async function GetAllFavouriteStories(req, res, next) {
  try {
    // It is not neccessary to check user exist because authentication already did it
    const userId = req.user?.id;

    const { limit, page, sort, type, authors, genres, star, view } = ConvertQuery(req.query);

    const favouriteStories = await FindAllFavouriteStories({
      userId: userId,
      limit: limit,
      page: page,
      storyType: type,
      sort: sort,
      star: star,
      view: view,
      authorsId: authors,
      genres: genres,
    });

    if (!favouriteStories || !favouriteStories.success) throw CreateError();

    favouriteStories.data.forEach((fav) => {
      fav.story.favourite = { id: fav.id };
    });

    return res.status(200).json({
      success: true,
      message: "Getting favourite stories successfully",
      data: favouriteStories.data,
      pagination: favouriteStories.pagination,
    });
  } catch (error) {
    next(error);
  }
}

export async function PostFavouriteStory(req, res, next) {
  try {
    // It is not neccessary to check user exist because authentication already did it
    const userId = req.user?.id;
    const storyId = req.body?.storyId;

    if (!storyId) throw CreateError(400, "'storyId' is required");

    const favouriteStory = await AddFavouriteStory({ userId: userId, storyId: storyId });
    if (!favouriteStory || !favouriteStory.success) throw CreateError();

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

    if (!favouriteId) throw CreateError(400, "'id' for favourite story is required");

    const removing = await SoftDeleteFavouriteStory({ id: favouriteId, userId: userId });

    if (!removing) throw CreateError();

    return res.status(200).json({
      success: true,
      message: "Delete user favourite story successfully",
    });
  } catch (error) {
    next(error);
  }
}
