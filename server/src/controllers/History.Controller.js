import { FindAllReadingHistories, AddReadingHistory, SoftDeleteReadingHistory, FindReadingHistory } from "../models/History.Model.js";

import { CreateError } from "../utils/ErrorHandle.js";
import ErrorCodes from "../constants/Error.js";
import { FindStory } from "../models/Story.Model.js";
import { FindStoryNode, ValidateStoryNodeType } from "../models/StoryNode.Model.js";
import { ConvertQuery } from "../utils/QueryConvert.js";

export async function GetAllReadingHistories(req, res, next) {
  try {
    // It is not neccessary to check user exist because authentication already did it
    const userId = req.user?.id;

    const { limit, page, sort, type, authors, genres, rating, view, fromDate, toDate } = ConvertQuery(req.query);

    const readingHistory = await FindAllReadingHistories({
      userId: userId,
      limit: limit,
      page: page,
      sort: sort,
      type: type,
      authorsId: authors,
      genres: genres,
      star: rating,
      view: view,
      fromDate: fromDate,
      toDate: toDate,
    });

    if (!readingHistory || !readingHistory.success) throw CreateError(ErrorCodes.INTERNAL_SERVER_ERROR);

    return res.status(200).json({
      success: true,
      message: "Get reading history successfully",
      data: readingHistory.data,
    });
  } catch (error) {
    if (!error.status) console.error("❌ [ReadingHistory.Controller.js] Error getting reading histories:", error);
    next(error);
  }
}

export async function PostReadingHistory(req, res, next) {
  try {
    const userId = req.user?.id;
    const storyId = req.body?.storyId;
    const storyNodeId = req.body?.storyNodeId;
    const datetime = req.body?.dateTime ? new Date(req.body.dateTime) : new Date();

    // Position will be added later

    // Make sure story and story node exist
    const story = await FindStory({ id: storyId });
    if (!story || !story.success || !story.data) throw CreateError(ErrorCodes.STORY_NOT_FOUND);
    const storyNode = await FindStoryNode({ id: storyNodeId });
    if (!storyNode || !storyNode.success || !storyNode.data) throw CreateError(ErrorCodes.STORY_NODE_NOT_FOUND);

    const histories = await AddReadingHistory({
      user_id: userId,
      story_id: storyId,
      story_node_id: storyNodeId,
      created_at: datetime,
    });

    if (!histories || !histories.success) throw CreateError(ErrorCodes.INTERNAL_SERVER_ERROR);

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
    if (!error.status) console.error("❌ [ReadingHistory.Controller.js] Error posting reading history:", error);
    next(error);
  }
}

export async function DeleteReadingHistory(req, res, next) {
  try {
    const userId = req.user?.id;
    const historyId = req.params?.historyId;

    if (!historyId) throw CreateError(ErrorCodes.BAD_REQUEST);

    // Make sure history exist
    const history = await FindReadingHistory({ id: historyId });

    if (!history || !history.success) throw CreateError(ErrorCodes.ASSET_NOT_FOUND);

    // Make sure reading history belong to user
    if (history.data.user_id !== userId) throw CreateError(ErrorCodes.FORBIDDEN);

    const removing = await SoftDeleteReadingHistory({ id: historyId });
    if (!removing || !removing.success) throw CreateError(ErrorCodes.INTERNAL_SERVER_ERROR);

    return res.status(200).json({
      success: true,
      message: "Delete reading history successfully",
    });
  } catch (error) {
    if (!error.status) console.error("❌ [ReadingHistory.Controller.js] Error deleting reading history:", error);
    next(error);
  }
}
