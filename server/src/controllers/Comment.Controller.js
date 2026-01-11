import ErrorCodes from "../constants/Error.js";
import { AddComment, Count, FindAllComments, SoftDeleteComment, UpdateComment } from "../models/Comment.Model.js";
import { FindStory } from "../models/Story.Model.js";
import { FindStoryNode } from "../models/StoryNode.Model.js";
import { CreateError } from "../utils/ErrorHandle.js";
import { ConvertQuery } from "../utils/QueryConvert.js";

export async function GetAllComments(req, res, next) {
  try {
    const storyId = req.params?.storyId;
    const storyNodeId = req.params?.storyNodeId;
    if (!storyId && !storyNodeId) throw CreateError(ErrorCodes.BAD_REQUEST);

    const { limit, page, sort } = ConvertQuery(req?.query);

    const comments = await FindAllComments({ storyId: storyId, storyNodeId: storyNodeId, sort: sort, page: page, limit: limit });

    if (!comments) throw CreateError(ErrorCodes.INTERNAL_SERVER_ERROR);

    return res.status(200).json({
      success: true,
      message: "Get all comments successfully",
      data: comments.data,
      pagination: comments.pagination,
    });
  } catch (error) {
    next(error);
  }
}

export async function PostComment(req, res, next) {
  try {
    const userId = req.user.id;
    const storyId = req.params?.storyId;
    const storyNodeId = req.params?.storyNodeId;
    const message = req.body?.message;
    if (!storyId && !storyNodeId) throw CreateError(ErrorCodes.BAD_REQUEST);
    if (!message) throw CreateError(ErrorCodes.MISSING_FIELD);

    const comment = await AddComment({ userId, storyId, storyNodeId, message });

    if (!comment || !comment.success) throw CreateError(ErrorCodes.INTERNAL_SERVER_ERROR);

    return res.status(200).json({
      success: true,
      message: "Add new comment successfully",
      data: {
        user: {
          id: userId,
        },
        story: {
          id: storyId,
        },
        ...(storyNodeId && {
          storyNode: {
            id: storyNodeId,
          },
        }),
        comment: {
          id: comment.data.id,
          message: comment.data.message,
        },
      },
    });
  } catch (error) {
    next(error);
  }
}

export async function PutComment(req, res, next) {
  try {
    const userId = req.user.id;
    const commentId = req.params?.id;
    const message = req.body?.message;
    if (!commentId) throw CreateError(ErrorCodes.BAD_REQUEST);
    if (!message) throw CreateError(ErrorCodes.MISSING_FIELD);

    // Make sure this comment exist and belong to user;

    const updateComment = await UpdateComment({ id: commentId }, { message: message, updated_at: new Date() });

    if (!updateComment || !updateComment.success) throw CreateError(ErrorCodes.INTERNAL_SERVER_ERROR);

    return res.status(200).json({
      success: true,
      message: "Update comment successfully",
      data: {
        comment: {
          id: commentId,
        },
        message: updateComment.data.message,
      },
    });
  } catch (error) {
    next(error);
  }
}

export async function DeleteComment(req, res, next) {
  try {
    const userId = req.user.id;
    const commentId = req.params?.id;
    if (!commentId) throw CreateError(ErrorCodes.BAD_REQUEST);

    // Soft delete
    const removing = await SoftDeleteComment({ id: commentId });
    if (!removing || !removing.success) throw CreateError(INTERNAL_SERVER_ERROR);

    return res.status(200).json({
      success: true,
      message: "Delete comment successfully",
    });
  } catch (error) {
    next(error);
  }
}

export async function GetCountComment(req, res, next) {
  try {
    const storyId = req.params?.storyId;
    const storyNodeId = req.params?.storyNodeId;
    if (!storyId && !storyNodeId) throw CreateError(ErrorCodes.BAD_REQUEST);

    const count = await Count({ storyId: storyId, storyNodeId: storyNodeId });

    if (!count || !count.success) throw CreateError(ErrorCodes.INTERNAL_SERVER_ERROR);

    return res.status(200).json({
      success: true,
      message: "Get all comments successfully",
      data: count.data,
    });
  } catch (error) {
    next(error);
  }
}
