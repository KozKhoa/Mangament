import { CreateError } from "../utils/ErrorHandle.js";
import ErrorCodes from "../constants/Error.js";
import { AddRatings, FindAllRatings, SoftDeleteRating, UpdateRating } from "../models/Rating.Model.js";
import { FindStory } from "../models/Story.Model.js";

import { ConvertQuery } from "../utils/QueryConvert.js";

// POST /stories/:id/ratings
export async function PostRating(req, res, next) {
  try {
    const userId = req.user?.id;
    const storyId = req.params?.id;
    const star = req.body?.star ? Number(req.body?.star) : null;
    const title = req.body?.title;
    const content = req.body?.content;

    if (!star || !title || !content) throw CreateError(400, '"star", "title" and "content" are required');

    if (star < 1 || star > 5) throw CreateError(400, '"star" must be number in range (1, 5)');

    if (title.length > 100) throw CreateError(400, "Title must less than 100 character");
    const rating = await AddRatings({ userId: userId, storyId: storyId, star: star, title: title, content: content });

    if (!rating) throw CreateError();

    return res.status(200).json({
      success: true,
      message: "Add new rating successfully",
      data: rating.data,
    });
  } catch (error) {
    next(error);
  }
}

export async function GetAllRatings(req, res, next) {
  try {
    const storyId = req.params?.id;
    if (!storyId) throw CreateError(400, "'id' is required");

    // Make sure story exist
    const story = await FindStory({ id: storyId });
    if (!story || !story.data) throw CreateError(404, "Story not found");

    const { limit, page, star, sort } = ConvertQuery(req?.query);

    const ratings = await FindAllRatings({ storyId: storyId, star: star, sort: sort, page: page, limit: limit });

    if (!ratings) throw CreateError();

    return res.status(200).json({
      success: true,
      message: "Getting all raings successfully",
      data: ratings.data,
      pagination: ratings.pagination,
    });
  } catch (error) {
    next(error);
  }
}

export async function PutRating(req, res, next) {
  try {
    const userId = req.user.id;
    const ratingId = req.params?.id;

    if (!ratingId) throw CreateError(400, "'id' is required");

    const star = req.body?.star ? Number(req.body?.star) : null;
    const message = req.body?.message || null;
    if (!star || !message) throw CreateError(400, "Missing field");
    if (star < 1 || star > 5) throw CreateError(400, '"star" must be number in range (1, 5)');

    // Make sure rating exist and belong to user
    const rating = await FindAllRatings({ id: ratingId });
    if (!rating || !rating.success || rating.data.length <= 0) throw CreateError(404, "Rating not found");
    if (rating.data[0].user.id !== userId) throw CreateError(403, "Forbidden");

    const updating = await UpdateRating({ id: ratingId }, { star: Number(star), message: message });
    if (!updating || !updating.success || !updating.data) throw CreateError();
    return res.status(200).json({
      success: true,
      message: "Update rating successfully",
      data: {
        user_id: userId,
        story_id: updating.data.story_id,
        rating: {
          id: updating.data.id,
          star: updating.data.star,
          message: updating.data.message,
        },
      },
    });
  } catch (error) {
    next(error);
  }
}

export async function DeleteRating(req, res, next) {
  try {
    const userId = req.user.id;
    const ratingId = req.params?.id;
    if (!ratingId) throw CreateError(400, "'id' is required");

    // Make sure rating exist and belong to user
    const rating = await FindAllRatings({ id: ratingId });
    if (!rating || !rating.success || rating.data.length <= 0) throw CreateError(404, "Rating not found");
    if (rating.data[0].user.id !== userId) throw CreateError(403, "Forbidden");

    // Remove
    const removing = await SoftDeleteRating({ id: ratingId });
    if (!removing || !removing.success) throw CreateError();
    return res.status(200).json({
      success: true,
      message: "Delete rating successfully",
    });
  } catch (error) {
    next(error);
  }
}
