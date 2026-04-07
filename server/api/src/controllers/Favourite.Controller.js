import { FindAllFavouriteStories, AddFavouriteStory, RemoveFavouriteStory, FindFavouriteStory } from "../services/favourite.service.js";
import { FindUser } from "../services/user.service.js";

import { CreateError } from "../utils/ErrorHandle.js";

import { ConvertQuery } from "../utils/QueryConvert.js";

// GET /favourites/user/me
export async function GetAllFavouriteStories(req, res, next) {
  try {
    const userId = req.user?.id;

    const { limit, page, sort, type, authors, genres, star, view, nations } = ConvertQuery(req.query);

    const favouriteStories = await FindAllFavouriteStories({
      userId: userId,
      limit: limit,
      page: page,
      storyType: type,
      sort: sort,
      star: star,
      view: view,
      nations: nations,
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

// POST /favourite/story/:id
export async function AddNewFavouriteStory(req, res, next) {
  try {
    const userId = req.user?.id;
    const storyId = req.params?.id;

    if (!storyId) throw CreateError(400, "'storyId' is required");

    const favouriteStory = await AddFavouriteStory({ userId: userId, storyId: storyId });

    return res.status(200).json({
      success: true,
      message: "Add new favourite story successfully",
      data: favouriteStory.data,
    });
  } catch (error) {
    next(error);
  }
}

// DELETE /favourites/:id
export async function DeleteFavouriteStory(req, res, next) {
  try {
    const userId = req.user?.id;

    const favouriteId = req.params?.id;

    if (!favouriteId) throw CreateError(400, "'id' for favourite story is required");

    const user = await FindUser({ id: userId });
    const favourite = await FindFavouriteStory(favouriteId);

    if (user.data.id !== favourite.data.user_id) throw CreateError(400, "You don't have permisson to remove other people's favourite story");

    await RemoveFavouriteStory(favouriteId);

    return res.status(200).json({
      success: true,
      message: "Delete user favourite story successfully",
    });
  } catch (error) {
    next(error);
  }
}
