import { CreateError } from "../utils/ErrorHandle.js";
import ErrorCodes from "../constants/Error.js";
import { AddRatings, CountRating, FindAllRatings, SoftDeleteRating, UpdateRating } from "../models/Rating.Model.js";
import { FindStory } from "../models/Story.Model.js";

export async function PostRating(req, res, next) {
  try {
    const userId = req.user?.id;
    const storyId = req.params?.id;
    const star = req.body?.star ? Number(req.body?.star) : null;
    const message = req.body?.message || null;
    if (!star || !message) throw CreateError(ErrorCodes.MISSING_FIELD);
    if (!storyId) throw CreateError(ErrorCodes.BAD_REQUEST);
    if (star < 1 || star > 5) throw CreateError(ErrorCodes.INVALID_INPUT);

    // Make sure story exist
    const story = await FindStory({ id: storyId });
    if (!story || !story.success || !story.data) throw CreateError(ErrorCodes.STORY_NOT_FOUND);

    const rating = await AddRatings({
      user_id: userId,
      story_id: storyId,
      star: Number(star),
      message: message,
    });

    if (rating && rating.error === "P2002")
      // Unique error code from prisma
      throw CreateError(ErrorCodes.ASSET_ALREADY_EXIST);
    if (!rating || !rating.data) throw CreateError(ErrorCodes.INTERNAL_SERVER_ERROR);

    return res.status(200).json({
      success: true,
      message: "Add new rating successfully",
      data: {
        story: {
          id: storyId,
        },
        user: {
          id: userId,
        },
        rating: {
          id: rating.data.id,
          star: rating.data.star,
          message: rating.data.message,
          created_at: rating.data.created_at,
        },
      },
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

    const limit = req.query?.limit ? Number(req.query.limit) : 1;
    const page = req.query?.page ? Number(req.query.page) : 1;
    const star = req.query.star ? req.query.star.split(",").map((range) => range.split("-").map((number) => parseFloat(number))) : [[0, 6]];
    const sort = {};

    if (req.query?.sort) {
      const [field, direction] = req.query.sort.split(":");
      sort[field.toLowerCase()] = direction.toLowerCase();
    } else sort["updated_at"] = "desc";

    const where = {
      story_id: storyId,
      OR: [...star.map(([min, max]) => ({ star: { gte: min, lte: max } }))],
    };

    const ratings = await FindAllRatings(where, sort, limit, (page - 1) * limit);

    if (!ratings || !ratings.success) throw CreateError(ErrorCodes.INTERNAL_SERVER_ERROR);

    return res.status(200).json({
      success: true,
      message: "Getting all raings successfully",
      data: ratings.data,
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
