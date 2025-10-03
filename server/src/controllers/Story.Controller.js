import { CreateError } from "../configs/ErrorHandle.js";
import ErrorCodes from "../constants/Error.js";
import { FindImage } from "../models/Image.Model.js";
import {
  FindAllStories,
  FindStory,
  FindAllStoryNodes,
  FindStoryNode,
} from "../models/Story.Model.js";

export const GetStoryInfo = async (req, res, next) => {
  try {
    const storyId = req?.params?.id;
    // Check user request
    if (!storyId) {
      throw CreateError(ErrorCodes.BAD_REQUEST);
    }

    const story = await FindStory({ id: storyId });
    if (!story || !story.success) {
      // If server not return anything or return success = false => fail to find story
      throw CreateError(ErrorCodes.INTERNAL_SERVER_ERROR);
    }
    if (!story.data) {
      throw CreateError(ErrorCodes.STORY_NOT_FOUND);
    }

    // Get cover art;
    let cover_art;
    if (story.data?.cover_art_id) {
      cover_art = FindImage({ id: story.cover_art });
    }

    res.status(200).json({
      success: true,
      message: "Getting story successfully",
      story: {
        id: story.data?.id,
        title: story.data?.title,
        nation: story.data?.nation,
        view: story.data?.view,
        rating: story.data?.rating,
        type: story.data?.type,
        status: story.data?.status,
        next_chapter_in: story.data?.next_chapter_in,
        number_of_chapter: story.data?.number_of_chapter,
        cover_art_url: cover_art?.url || null,
      },
    });
  } catch (error) {
    console.error("❌ [Story.Controller.js] Error getting user info:", error);
    next(error);
  }
};

export const GetListStory = async (req, res, next) => {
  try {
    const query = req?.query; //query = { limit, page, author, raing, orderBy,  }
    if (!query) {
      throw CreateError(ErrorCodes.BAD_REQUEST);
    }

    const stories = await FindAllStories((orderBy = query.orderBy));
  } catch (error) {
    console.error("❌ [Story.Controller.js] Error getting list user:", error);
    next(error);
  }
};
