import { FindAllReadingHistories, AddReadingHistory, SoftDeleteReadingHistory } from "../models/History.Model.js";

import { CreateError } from "../utils/ErrorHandle.js";
import { ConvertQuery } from "../utils/QueryConvert.js";

export async function GetAllReadingHistories(req, res, next) {
  try {
    // It is not neccessary to check user exist because authentication already did it
    const userId = req.user?.id;

    const { limit, page, sort, type, authors, genres, star, view, fromDate, toDate } = ConvertQuery(req.query);

    const readingHistory = await FindAllReadingHistories({
      userId: userId,
      limit: limit,
      page: page,
      sort: sort,
      type: type,
      authorsId: authors,
      genres: genres,
      star: star,
      view: view,
      fromDate: fromDate,
      toDate: toDate,
    });

    if (!readingHistory) throw CreateError();

    return res.status(200).json({
      success: true,
      message: "Get reading history successfully",
      data: readingHistory.data,
      pagination: readingHistory.pagination,
    });
  } catch (error) {
    next(error);
  }
}

export async function PostReadingHistory(req, res, next) {
  try {
    const userId = req.user?.id;
    const storyId = req.body?.storyId;
    const storyNodeId = req.body?.storyNodeId;

    // Position will be added later

    const histories = await AddReadingHistory({ userId: userId, storyId: storyId, storyNodeId: storyNodeId });

    if (!histories) throw CreateError();

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

    if (!historyId) throw CreateError(400, "'historyId' is required");

    const removing = await SoftDeleteReadingHistory({ id: historyId, userId: userId });
    if (!removing) throw CreateError();

    return res.status(200).json({
      success: true,
      message: "Delete reading history successfully",
    });
  } catch (error) {
    if (!error.status) console.error("❌ [ReadingHistory.Controller.js] Error deleting reading history:", error);
    next(error);
  }
}
