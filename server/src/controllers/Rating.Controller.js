import { CreateError } from "../utils/ErrorHandle.js";
import ErrorCodes from "../constants/Error.js";
import { AddRatings, CountRating, FindAllRatings, SoftDeleteRating, UpdateRating } from "../models/Rating.Model.js";
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

    if (!star || !title || !content) throw CreateError({ status: ErrorCodes.MISSING_FIELD.status, message: '"star", "title" and "content" are required' });

    if (star < 1 || star > 5) throw CreateError({ status: ErrorCodes.INVALID_INPUT.status, message: '"star" must be number in range (1, 5)' });

    if (title.length > 100) throw CreateError({ status: ErrorCodes.INVALID_INPUT.status, message: "Title must less than 100 character" });

    const rating = await AddRatings({ userId: userId, storyId: storyId, star: star, title: title, content: content });

    if (!rating) throw CreateError(ErrorCodes.INTERNAL_SERVER_ERROR);

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
    if (!storyId) throw CreateError(ErrorCodes.BAD_REQUEST);

    // Make sure story exist
    const story = await FindStory({ id: storyId });
    if (!story || !story.data) throw CreateError(ErrorCodes.STORY_NOT_FOUND);

    const { limit, page, star, sort } = ConvertQuery(req?.query);

    const ratings = await FindAllRatings({ storyId: storyId, star: star, sort: sort, page: page, limit: limit });

    if (!ratings) throw CreateError(ErrorCodes.INTERNAL_SERVER_ERROR);

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

    if (!ratingId) throw CreateError(ErrorCodes.BAD_REQUEST);

    const star = req.body?.star ? Number(req.body?.star) : null;
    const message = req.body?.message || null;
    if (!star || !message) throw CreateError(ErrorCodes.MISSING_FIELD);
    if (star < 1 || star > 5) throw CreateError(ErrorCodes.INVALID_INPUT);

    // Make sure rating exist and belong to user
    const rating = await FindAllRatings({ id: ratingId });
    if (!rating || !rating.success || rating.data.length <= 0) throw CreateError(ErrorCodes.ASSET_NOT_FOUND);
    if (rating.data[0].user.id !== userId) throw CreateError(ErrorCodes.FORBIDDEN);

    const updating = await UpdateRating({ id: ratingId }, { star: Number(star), message: message });
    if (!updating || !updating.success || !updating.data) throw CreateError(ErrorCodes.INTERNAL_SERVER_ERROR);

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
    if (!ratingId) throw CreateError(ErrorCodes.BAD_REQUEST);

    // Make sure rating exist and belong to user
    const rating = await FindAllRatings({ id: ratingId });
    if (!rating || !rating.success || rating.data.length <= 0) throw CreateError(ErrorCodes.ASSET_NOT_FOUND);
    if (rating.data[0].user.id !== userId) throw CreateError(ErrorCodes.FORBIDDEN);

    // Remove
    const removing = await SoftDeleteRating({ id: ratingId });
    if (!removing || !removing.success) throw CreateError(ErrorCodes.INTERNAL_SERVER_ERROR);

    return res.status(200).json({
      success: true,
      message: "Delete rating successfully",
    });
  } catch (error) {
    next(error);
  }
}

export async function GetCountRating(req, res, next) {
  try {
    const query = req.query;

    const storyId = req.params?.id;
    if (!storyId) throw CreateError(ErrorCodes.BAD_REQUEST);

    // Make sure story exist
    const story = await FindStory({ id: storyId });
    if (!story || !story.data) throw CreateError(ErrorCodes.STORY_NOT_FOUND);

    const star = query.star ? query.star.split(",").map((range) => range.split("-").map((number) => parseFloat(number))) : [[0, 6]];

    const where = {
      story_id: storyId,

      OR: [...star.map(([min, max]) => ({ star: { gte: min, lte: max } }))],
    };

    const count = await CountRating(where);

    if (!count || !count.success) throw CreateError(ErrorCodes.INTERNAL_SERVER_ERROR);

    return res.status(200).json({
      success: true,
      message: "Getting count ratings successfully",
      data: count.data,
    });
  } catch (error) {
    next(error);
  }
}
