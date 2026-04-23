import ErrorCodes from "../constants/Error.js";
import { AddComment, FindAllComments, UpdateComment } from "../services/comment.service.js";

import * as commentService from "../services/comment.service.js";

import { CreateError } from "../utils/ErrorHandle.js";
import { ConvertQuery } from "../utils/QueryConvert.js";

export async function GetAllComments(req, res, next) {
  try {
    const storyId = req.params?.storyId;
    const storyNodeId = req.params?.storyNodeId ?? null;

    if (!storyId && !storyNodeId) throw CreateError(400, "'storyId' or 'storyNodeId' is required");

    const { limit, page, sort } = ConvertQuery(req?.query);

    const comments = await FindAllComments({ storyId: storyId, storyNodeId: storyNodeId, sort: sort, page: page, limit: limit });

    if (!comments) throw CreateError();

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
    const storyNodeId = req.params?.storyNodeId ?? null;

    const { title, content } = req.body;

    if (!storyId && !storyNodeId) throw CreateError(400, "Require at least 'storyId' or 'storyNodeId'");

    const comment = await AddComment({ userId, storyId, storyNodeId, title, content });

    if (!comment) throw CreateError();

    return res.status(200).json({
      success: true,
      message: "Add new comment successfully",
      data: comment.data,
    });
  } catch (error) {
    next(error);
  }
}

export async function PutComment(req, res, next) {
  try {
    const userId = req.user.id;
    const commentId = req.params?.id;
    const { title, content } = req.body;

    if (!commentId) throw CreateError(400, "'id' for comment is required");

    // Find the comment first to check ownership
    const comment = await commentService.FindComment(commentId);
    if (!comment?.data) throw CreateError(404, "Comment not found");
    if (comment.data.user_id !== userId) throw CreateError(401, "User is not allowed to update others' comments");

    const updateComment = await UpdateComment(commentId, { title, content });

    if (!updateComment || !updateComment.success) throw CreateError(ErrorCodes.INTERNAL_SERVER_ERROR);

    return res.status(200).json({
      success: true,
      message: "Update comment successfully",
      data: updateComment.data,
    });
  } catch (error) {
    next(error);
  }
}

export async function DeleteComment(req, res, next) {
  try {
    const userId = req.user.id;
    const commentId = req.params?.id;
    if (!commentId) throw CreateError(400, "'id' for comment is required");

    const comment = await commentService.FindComment(commentId);
    if (!comment?.data) throw CreateError(400, "Comment not found");

    if (comment.data?.user.id !== userId) throw CreateError(401, "User is not allow to remove others' comment");

    await commentService.SoftDeleteComment(commentId);

    return res.status(200).json({
      success: true,
      message: "Delete comment successfully",
    });
  } catch (error) {
    next(error);
  }
}
