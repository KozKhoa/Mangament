import { CreateError } from "../utils/ErrorHandle.js";

import { FindAllStories, FindStory, UpdateStory, GetReview, FindRandomStory } from "../services/story.service.js";

import * as storyService from "../services/story.service.js";
import * as favouriteService from "../services/favourite.service.js";
import * as ratingService from "../services/rating.service.js";

import { FindAllReadingHistories } from "../services/history.service.js";
import { throwErrorIfInvalidGenres } from "../utils/Validators.js";

export async function GetStory(req, res, next) {
  try {
    const userId = req.user?.id;
    const storyId = req?.params?.id;
    const title = req.params?.title;

    // Check user request
    if (!storyId && !title) throw CreateError(400, '"id" or "title" is required');

    const { isGettingChildren, isGettingSummary, isGettingNewestChapter } = req.query;

    const story = await FindStory({
      id: storyId,
      title: title,
      isActived: true,
      isGettingChildren: isGettingChildren,
      isGettingNewestChapter: isGettingNewestChapter,
    });

    // If server not return anything or return success = false => fail to find story
    if (!story) throw CreateError();

    if (!story.data) throw CreateError(404, "Story not found");

    // Is story in user favourites list
    if (userId) {
      const favourite = await favouriteService.FindAllFavouriteStories({ userId: userId, storyId: story.data.id, page: 1, limit: 1 });

      if (favourite && favourite.data.length > 0) {
        story.data.favourite = { id: favourite.data.at(0).id };
      }
    }

    //  If user already rate this story
    if (userId) {
      const rating = await ratingService.FindAllRatings({ userId: userId, storyId: story.data.id, limit: 1, page: 1 });

      if (rating && rating.data.length > 0) {
        story.data.rating = rating.data.at(0);
      }
    }

    // Is story in user reading histories list
    if (userId) {
      const histories = await FindAllReadingHistories({ userId: userId, storyId: story.data.id, sort: { updated_at: "desc" }, page: 1, limit: 1 });

      if (histories && histories.data.length > 0) {
        story.data.history = histories.data.at(0);
      }
    }

    if (!isGettingSummary) delete story.data.summary;

    res.status(200).json({ success: true, message: "Getting story successfully", data: story.data });
  } catch (error) {
    next(error);
  }
}

// GET stories/:id/review
export async function GetStoryReview(req, res, next) {
  try {
    const storyId = req.params?.id;

    if (!storyId) throw CreateError(400, "'id' is required");

    const review = await GetReview(storyId, 4);

    return res.status(200).json({ success: true, message: "Get story review successfully ", data: review.data });
  } catch (error) {
    next(error);
  }
}

// GET stories/random
export async function GetRandomStory(req, res, next) {
  try {
    const story = await FindRandomStory();

    return res.status(200).json({
      success: true,
      message: "Get random story successfully",
      data: story.data,
    });
  } catch (error) {
    next(error);
  }
}

// GET stories
export async function GetAllStories(req, res, next) {
  try {
    const userId = req?.user?.id;

    const { isGettingChildren, author, keyword, isGettingNewestChapter, limit, status, page, type, genre, star, view, sort, nation } = req.query;

    if (genre && genre.length > 0) await throwErrorIfInvalidGenres(genre);

    const stories = await FindAllStories({
      isActived: true,
      keyword: keyword,
      type: type,
      view: view,
      star: star,
      genres: genre,
      authorsId: author,
      sort: sort,
      page: page,
      limit: limit,
      nation: nation,
      status: status,
      isGettingChildren: isGettingChildren,
      isGettingNewestChapter: isGettingNewestChapter,
    });

    if (!stories || !stories.success) {
      throw CreateError();
    }

    if (userId) {
      const favourites = await favouriteService.FindAllFavouriteStories({
        userId: userId,
        limit: 2147483647,
        page: 1,
        storyType: type,
        star: star,
        view: view,
        authorsId: author,
        genres: genre,
      });

      const favouriteStoryIds = new Map(favourites.data.map((fav) => [fav.story.id, fav.id]));

      stories.data.map((story) => {
        const favId = favouriteStoryIds.get(story.id);
        if (favId) story.favourite = { id: favId };
      });
    }

    return res.status(200).json({
      success: true,
      message: "Get story list successfully",
      data: stories.data,
      pagination: stories.pagination,
    });
  } catch (error) {
    next(error);
  }
}

// GET /stories/:id/recommend
export async function GetRecommendStories(req, res, next) {
  try {
    const userId = req?.user?.id;
    const storyId = req?.params?.id;

    const page = Number(req?.query?.page || 1);
    const limit = Number(req?.query?.limit || 10);

    if (!storyId) throw CreateError(400, "'id' is required");

    const recommendStories = await storyService.GetRecommendStories({ storyId, userId, page, limit });

    return res.status(200).json({
      success: true,
      message: "Get recommend stories successfully",
      data: recommendStories.data,
    });
  } catch (error) {
    next(error);
  }
}

export async function AddOneViewForStory(req, res, next) {
  try {
    const storyId = req?.params?.id;
    if (!storyId) throw CreateError(400, "'id' is required");

    const update = await UpdateStory(storyId, { view: { increment: 1 } });
    if (!update) throw CreateError();

    return res.status(200).json({
      success: true,
      message: "Add one view for story successfully",
      data: {
        story: {
          id: storyId,
        },
      },
    });
  } catch (error) {
    next(error);
  }
}
