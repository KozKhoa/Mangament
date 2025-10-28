import {
  FindAllReadingHistories,
  AddReadingHistory,
  SoftDeleteReadingHistory,
} from "../models/History.Model.js";

import { CreateError } from "../utils/ErrorHandle.js";
import ErrorCodes from "../constants/Error.js";
import { FindStory } from "../models/Story.Model.js";
import { FindStoryNode } from "../models/StoryNode.Model.js";

export async function GetAllReadingHistories(req, res, next) {
  try {
    // It is not neccessary to check user exist because authentication already did it
    const userId = req.user?.id;
    const query = req.query;

    // Analys the query from the user
    const limit = query?.limit ? Number(query.limit) : 1;
    const page = query?.page ? Number(query.page) : 1;
    const order = {};
    if (query?.sort) {
      const [field, direction] = query.sort.split(":");
      order[field.toLowerCase()] = direction.toLowerCase();
    } else {
      order["created_at"] = "desc";
    }

    const readingHistory = await FindAllReadingHistories(
      { user_id: userId },
      limit,
      (page - 1) * limit,
      order
    );

    if (!readingHistory || !readingHistory.success)
      throw CreateError(ErrorCodes.INTERNAL_SERVER_ERROR);
    if (!readingHistory.data || readingHistory.data.length <= 0) {
      return res.status(200).json({
        success: true,
        message: "User has no reading history",
        data: null,
      });
    }

    return res.status(200).json({
      success: true,
      message: "Get reading history successfully",
      data: readingHistory.data,
    });
  } catch (error) {
    if (!error.status)
      console.error(
        "❌ [ReadingHistory.Controller.js] Error getting reading histories:",
        error
      );
    next(error);
  }
}

export async function PostReadingHistory(req, res, next) {
  try {
    const userId = req.user?.id;
    const storyId = req.body?.storyId;
    const storyNodeId = req.body?.storyNodeId;
    const datetime = req.body?.dateTime
      ? new Date(req.body.dateTime)
      : new Date();

    // Position will be added later

    // Make sure story and story node exist
    const story = await FindStory({ id: storyId });
    if (!story || !story.success || !story.data)
      throw CreateError(ErrorCodes.STORY_NOT_FOUND);
    const storyNode = await FindStoryNode({ id: storyNodeId });
    if (!storyNode || !storyNode.success || !storyNode.data)
      throw CreateError(ErrorCodes.STORY_NODE_NOT_FOUND);

    const histories = await AddReadingHistory({
      user_id: userId,
      story_id: storyId,
      story_node_id: storyNodeId,
      created_at: datetime,
    });

    if (!histories || !histories.success)
      throw CreateError(ErrorCodes.INTERNAL_SERVER_ERROR);

    return res.status(200).json({
      success: true,
      message: "Adding reading history successfully",
      data: {
        history: { id: histories.data.id },
        user: { id: histories.data.user_id },
        story: { id: histories.data.story_id },
        story_node: { id: histories.data.story_node_id },
        created_at: histories.data.created_at,
      },
    });
  } catch (error) {
    if (!error.status)
      console.error(
        "❌ [ReadingHistory.Controller.js] Error posting reading history:",
        error
      );
    next(error);
  }
}

export async function DeleteReadingHistory(req, res, next) {
  try {
    const userId = req.user?.id;
    const historyId = req.params?.historyId;

    if (!historyId) throw CreateError(ErrorCodes.BAD_REQUEST);

    // Make sure history exist
    const history = await FindAllReadingHistories({ id: historyId });
    if (!history || !history.success || history.data.length <= 0)
      throw CreateError(ErrorCodes.ASSET_NOT_FOUND);

    // Make sure reading history belong to user
    if (history.data[0].user_id !== userId)
      throw CreateError(ErrorCodes.FORBIDDEN);

    const removing = await SoftDeleteReadingHistory({ id: historyId });
    if (!removing || !removing.success)
      throw CreateError(ErrorCodes.INTERNAL_SERVER_ERROR);

    return res.status(200).json({
      success: true,
      message: "Delete reading history successfully",
    });
  } catch (error) {
    if (!error.status)
      console.error(
        "❌ [ReadingHistory.Controller.js] Error deleting reading history:",
        error
      );
    next(error);
  }
}
