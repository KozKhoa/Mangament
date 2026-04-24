import { FindAllReadingHistories, AddReadingHistory, SoftDeleteReadingHistory } from "../services/history.service.js";

import { CreateError } from "../utils/ErrorHandle.js";

// GET /histories
export async function GetAllReadingHistories(req, res, next) {
  try {
    const userId = req.user?.id;

    const { limit, page, sort, type, author, genre, star, view, fromDate, toDate } = req.query;

    const readingHistory = await FindAllReadingHistories({
      userId: userId,
      limit: limit,
      page: page,
      sort: sort,
      type: type,
      authorsId: author,
      genres: genre,
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

// POST /histories/story/:storyId/story-node/:storyNodeId
export async function AddNewReadingHistory(req, res, next) {
  try {
    const userId = req.user?.id;

    const storyId = req.params?.storyId;
    const storyNodeId = req.params?.storyNodeId;

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
    next(error);
  }
}

// DELETE /histories/:id
export async function DeleteReadingHistory(req, res, next) {
  try {
    const historyId = req.params?.id;

    if (!historyId) throw CreateError(400, "'historyId' is required");

    const removing = await SoftDeleteReadingHistory(historyId);
    if (!removing) throw CreateError();

    return res.status(200).json({
      success: true,
      message: "Delete reading history successfully",
    });
  } catch (error) {
    next(error);
  }
}
