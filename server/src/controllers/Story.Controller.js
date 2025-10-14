import { CreateError } from "../configs/ErrorHandle.js";
import ErrorCodes from "../constants/Error.js";
import { FindImage } from "../models/Image.Model.js";
import {
  FindAllStories,
  FindStory,
  FindAllStoryNodes,
  FindStoryNode,
  GetStoryTree,
  FindComments,
} from "../models/Story.Model.js";

export const GetStoryInfo = async (req, res, next) => {
  try {
    const storyId = req?.params?.id;
    const isGettingChildren =
      req?.query?.isGettingChildren === "true" ? true : false;
    const isGettingContent =
      req?.query?.isGettingContent === "true" ? true : false;
    // Check user request
    if (!storyId) {
      throw CreateError(ErrorCodes.BAD_REQUEST);
    }

    const story = await FindStory(
      { id: storyId },
      isGettingChildren,
      isGettingContent
    );

    if (!story || !story.success) {
      // If server not return anything or return success = false => fail to find story
      throw CreateError(ErrorCodes.INTERNAL_SERVER_ERROR);
    }
    if (!story.data) {
      throw CreateError(ErrorCodes.STORY_NOT_FOUND);
    }

    res.status(200).json({
      success: true,
      message: "Getting story successfully",
      data: story.data,
    });
  } catch (error) {
    if (!error.status)
      console.error("❌ [Story.Controller.js] Error getting user info:", error);
    next(error);
  }
};

export const GetListStory = async (req, res, next) => {
  try {
    const query = req?.query;
    if (!query) {
      throw CreateError(ErrorCodes.BAD_REQUEST);
    }

    // split query
    const limit = query.limit ? Number(query.limit) : 1;
    const page = query.page ? Number(query.page) : 1;
    const types = query.type ? query.type.split(",") : null;
    const authors = query.author ? query.author.split(",") : null;
    const genres = query.genre ? query.genre.split(",") : null;
    // rating = [[1,2], [4,5]]
    const rating = query.rating
      ? query.rating
          .split(",")
          .map((range) => range.split("-").map((number) => parseFloat(number)))
      : [[0, 5]];
    // view = [[0, 100], [1000, 100000]]
    const view = query.view
      ? query.view
          .split(",")
          .map((range) => range.split("-").map((number) => Number(number)))
      : [[0, 2147483647]];

    // Create where
    const where = {
      ...(types && { type: { in: types } }),
      ...(authors && {
        author: { some: { author_id: { in: authors } } },
      }),
      ...(genres && {
        genre: { some: { genre: { in: genres } } },
      }),
      OR: [
        ...rating.map(([min, max]) => ({
          star: { gte: min, lte: max },
        })),
        ...view.map(([min, max]) => ({
          view: { gte: min, lte: max },
        })),
      ],
    };

    const order = {};
    if (query?.orderBy) {
      const [field, direction] = query.orderBy.split(":");
      order[field.toLowerCase()] = direction.toLowerCase();
    } else {
      order["update_at"] = "desc";
    }

    const stories = await FindAllStories(
      where,
      order,
      limit,
      (page - 1) * limit
    );

    if (!stories) {
      throw CreateError(ErrorCodes.INTERNAL_SERVER_ERROR);
    }

    return res.status(200).json({
      success: true,
      message: "Get story list successfully",
      data: stories.data,
    });
  } catch (error) {
    if (!error.status)
      console.error("❌ [Story.Controller.js] Error getting list user:", error);
    next(error);
  }
};

export const GetStoryNodeInfo = async (req, res, next) => {
  try {
    const storyNodeId = req?.params?.id;
    const isGettingChildren =
      req?.query?.isGettingChildren === "true" ? true : false;
    const isGettingContent =
      req?.query?.isGettingContent === "true" ? true : false;

    if (!storyNodeId) {
      throw CreateError(ErrorCodes.BAD_REQUEST);
    }

    const node = await FindStoryNode(
      { id: storyNodeId },
      isGettingChildren,
      isGettingContent
    );
    if (!node || !node.success) {
      throw CreateError(ErrorCodes.INTERNAL_SERVER_ERROR);
    }
    if (!node.data) {
      throw CreateError(ErrorCodes.STORY_NODE_NOT_FOUND);
    }

    res.status(200).json({
      success: true,
      message: "Get story node successfully",
      data: node.data,
    });
  } catch (error) {
    if (!error.status)
      console.error("❌ [Story.Controller.js] Error getting user info:", error);
    next(error);
  }
};

export async function GetComments(req, res, next) {
  try {
    const storyId = req?.params?.storyId;
    const storyNodeId = req?.params?.storyNodeId;
    // Check user request
    if (!storyId) {
      throw CreateError(ErrorCodes.BAD_REQUEST);
    }

    const query = req?.query;
    const limit = query.limit ? Number(query.limit) : 1;
    const page = query.page ? Number(query.page) : 1;
    const order = {};
    if (query?.orderBy) {
      const [field, direction] = query.orderBy.split(":");
      order[field.toLowerCase()] = direction.toLowerCase();
    } else {
      order["create_at"] = "desc";
    }
    const userId = query.userId ? query.userId : null;

    const comments = await FindComments(
      {
        user_id: userId,
        story_id: storyId,
        story_node_id: storyNodeId,
      },
      order,
      limit,
      (page - 1) * limit
    );

    return res.status(200).json({
      success: true,
      message: "Get comments successfully",
      data: comments.data || [],
    });
  } catch (error) {
    console.error("❌ [Story.Controller.js] Error getting comment", error);
    next(error);
  }
}

export async function AddNewComment(req, res, next) {
  try {
  } catch (error) {
    console.error("❌ [Story.Controller.js] Error getting comment", error);
    next(error);
  }
}
