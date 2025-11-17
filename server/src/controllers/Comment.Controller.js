import ErrorCodes from "../constants/Error.js";
import {
  AddComment,
  FindAllComments,
  SoftDeleteComment,
  UpdateComment,
} from "../models/Comment.Model.js";
import { FindStory } from "../models/Story.Model.js";
import { FindStoryNode } from "../models/StoryNode.Model.js";
import { CreateError } from "../utils/ErrorHandle.js";

export async function GetAllComments(req, res, next) {
  try {
    const storyId = req.params?.storyId;
    const storyNodeId = req.params?.storyNodeId;
    if (!storyId && !storyNodeId) throw CreateError(ErrorCodes.BAD_REQUEST);

    const limit = req.query?.limit ? Number(req.query.limit) : 1;
    const page = req.query?.page ? Number(req.query.page) : 1;
    const sort = {};
    if (req.query?.sort) {
      const [field, direction] = req.query.sort.split(":");
      sort[field.toLowerCase()] = direction.toLowerCase();
    } else sort["created_at"] = "desc";

    const comments = await FindAllComments(
      {
        ...(storyId && { story_id: storyId }),
        ...(storyNodeId
          ? { story_node_id: storyNodeId }
          : { story_node_id: null }),
      },
      sort,
      limit,
      (page - 1) * limit
    );

    if (!comments || !comments.success)
      throw CreateError(ErrorCodes.INTERNAL_SERVER_ERROR);

    return res.status(200).json({
      success: true,
      message: "Get all comments successfully",
      data: comments.data,
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

    // Make sure story and story node exist
    let storyNode;
    if (storyNodeId) {
      storyNode = await FindStoryNode({ id: storyNodeId });
      if (!storyNode || !storyNode.success || !storyNode.data)
        throw CreateError(ErrorCodes.STORY_NODE_NOT_FOUND);
    }
    const story = await FindStory({ id: storyId || storyNode.data.story_id });
    if (!story || !story || !story.data)
      throw CreateError(ErrorCodes.STORY_NOT_FOUND);

    const comment = await AddComment({
      user_id: userId,
      story_id: storyId || story.data.id,
      message: message,
      ...(storyNodeId
        ? { story_node_id: storyNodeId }
        : { story_node_id: null }),
    });

    if (!comment || !comment.success)
      throw CreateError(ErrorCodes.INTERNAL_SERVER_ERROR);

    return res.status(200).json({
      success: true,
      message: "Add new comment successfully",
      data: {
        user: {
          id: userId,
        },
        story: {
          id: story.data.id,
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
    const comment = await FindAllComments({ id: commentId });
    if (!comment || !comment.success || comment.data.length <= 0)
      throw CreateError(ErrorCodes.ASSET_NOT_FOUND);
    if (userId !== comment.data[0].user.id)
      throw CreateError(ErrorCodes.FORBIDDEN);

    const updateComment = await UpdateComment(
      { id: commentId },
      { message: message, updated_at: new Date() }
    );

    if (!updateComment || !updateComment.success)
      throw CreateError(ErrorCodes.INTERNAL_SERVER_ERROR);

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

    // Make sure comment exist and belong to user
    const comment = await FindAllComments({ id: commentId });
    if (!comment || !comment.success || comment.data.length <= 0)
      throw CreateError(ErrorCodes.ASSET_NOT_FOUND);
    if (userId !== comment.data[0].user.id)
      throw CreateError(ErrorCodes.FORBIDDEN);

    // Soft delete
    const removing = await SoftDeleteComment({ id: commentId });
    if (!removing || !removing.success)
      throw CreateError(INTERNAL_SERVER_ERROR);

    return res.status(200).json({
      success: true,
      message: "Delete comment successfully",
    });
  } catch (error) {
    next(error);
  }
}
