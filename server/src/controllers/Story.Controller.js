import path from "path";
import { CreateError } from "../utils/ErrorHandle.js";
import ErrorCodes from "../constants/Error.js";
import { ValidateStoryType, ValidateStoryStatus } from "../models/Enum.Model.js";

import { ValidateGenre } from "../models/Genre.Model.js";
import { AddImage } from "../models/Image.Model.js";
import { FindAllStories, FindStory, UpdateStory, AddStory, SoftDeleteStory, CountStory, GetReview, FindRandomStory } from "../models/Story.Model.js";

import { FindAllFavouriteStories, FindFavouriteStory } from "../models/Favourite.Model.js";

import { CreateNewFolder, MoveFile } from "../utils/FileHandle.js";
import DIRECTORY from "../constants/Directory.js";
import { ConvertQuery } from "../utils/QueryConvert.js";
import { FindAllReadingHistories } from "../models/History.Model.js";

export async function GetStory(req, res, next) {
  try {
    const userId = req.user?.id;
    const storyId = req?.params?.id;
    const title = req.params?.title;

    // Check user request
    if (!storyId && !title) throw CreateError(400, '"id" or "title" is required');

    const { type, isGettingChildren, isGettingContent, isGettingSummary, isGettingNewestChapter } = ConvertQuery(req.query);

    const story = await FindStory({
      id: storyId,
      title: title,
      isGettingChildren: isGettingChildren,
      isGettingContent: isGettingContent,
      isGettingNewestChapter: isGettingNewestChapter,
    });

    // If server not return anything or return success = false => fail to find story
    if (!story) throw CreateError();

    if (!story.data) throw CreateError(404, "Story not found");

    // Is story in user favourites list
    if (userId) {
      const favourite = await FindFavouriteStory({ userId: userId, storyId: story.data.id });

      if (favourite && favourite.data) {
        story.data.favourite = { id: favourite.data.id };
      }
    }

    // Is story in user reading histories list
    if (userId) {
      const histories = await FindAllReadingHistories({ userId: userId, storyId: story.data.id, sort: { updated_at: "desc" }, page: 1, limit: 1 });

      if (histories && histories.data.length > 0) {
        story.data.history = histories.data.at(0);
      }
    }

    if (!isGettingSummary) delete story.data.summary;

    res.status(200).json({ success: true, message: "Getting story successfully", data: story.data });
  } catch (error) {
    next(error);
  }
}

export async function GetStoryReview(req, res, next) {
  try {
    const storyId = req.params?.id;

    if (!storyId) throw CreateError(400, "'id' is required");

    const review = await GetReview(storyId, 4);

    return res.status(200).json({ success: true, message: "Get story review successfully ", data: review });
  } catch (error) {
    next(error);
  }
}

export async function GetCountStories(req, res, next) {
  try {
    const query = req.query;

    const type = query.type ? query.type.split(",") : null;

    const authors = query.author ? query.author.split(",") : null;

    const genres = query.genre ? query.genre.split(",") : null;
    if (!ValidateGenre(genres)) throw CreateError(400, "Invalid genre");

    // rating = [[1,2], [4,5]]
    const rating = query.star ? query.star.split(",").map((range) => range.split("-").map((number) => parseFloat(number))) : [[0, 5]];
    // view = [[0, 100], [1000, 100000]]
    const view = query.view ? query.view.split(",").map((range) => range.split("-").map((number) => Number(number))) : [[0, 2147483647]];

    // Create where
    const where = {
      ...(type && { type: { in: type } }),
      ...(authors && {
        authors: { some: { author_id: { in: authors } } },
      }),
      ...(genres && {
        genres: { hasEvery: genres },
      }),
      AND: [
        {
          OR: [...rating.map(([min, max]) => ({ star: { gte: min, lte: max } }))],
        },
        {
          OR: [...view.map(([min, max]) => ({ view: { gte: min, lte: max } }))],
        },
      ],
    };

    const count = (await CountStory(where)).data;

    return res.status(200).json({
      success: true,
      message: "Get count stories successfully",
      data: {
        count: count,
      },
    });
  } catch (error) {
    next(error);
  }
}

export async function GetRandomStory(req, res, next) {
  try {
    const story = await FindRandomStory();

    return res.status(200).json({
      success: true,
      message: "Get random story successfully",
      data: story.data,
    });
  } catch (error) {
    next(error);
  }
}

export async function GetAllStories(req, res, next) {
  try {
    const userId = req?.user?.id;

    const { isGettingChildren, authors, keyword, isGettingNewestChapter, limit, status, page, type, genres, star, view, sort } = ConvertQuery(req.query);

    const stories = await FindAllStories({
      keyword: keyword,
      type: type,
      view: view,
      star: star,
      genres: genres,
      genres: genres,
      authorsId: authors,
      sort: sort,
      page: page,
      limit: limit,
      status: status,
      isGettingChildren: isGettingChildren,
      isGettingNewestChapter: isGettingNewestChapter,
    });

    if (!stories || !stories.success) {
      throw CreateError();
    }

    if (userId) {
      const favourites = await FindAllFavouriteStories({
        userId: userId,
        limit: 2147483647,
        page: 1,
        storyType: type,
        star: star,
        view: view,
        authorsId: authors,
        genres: genres,
      });

      const favouriteStoryIds = new Map(favourites.data.map((fav) => [fav.story.id, fav.id]));

      stories.data.map((story, i) => {
        const favId = favouriteStoryIds.get(story.id);
        if (favId) story.favourite = { id: favId };
      });
    }

    return res.status(200).json({
      success: true,
      message: "Get story list successfully",
      data: stories.data,
      pagination: stories.pagination,
    });
  } catch (error) {
    next(error);
  }
}

export async function AddOneViewForStory(req, res, next) {
  try {
    const storyId = req?.params?.id;
    if (!storyId) throw CreateError(400, "'id' is required");

    const update = await UpdateStory(storyId, { view: { increment: 1 } });
    if (!update) throw CreateError();

    return res.status(200).json({
      success: true,
      message: "Add one view for story successfully",
      data: {
        story: {
          id: storyId,
        },
      },
    });
  } catch (error) {
    next(error);
  }
}

export async function PostStory(req, res, next) {
  try {
    // Get information from body
    const userId = req.user.id;
    const title = req.body?.title;
    const type = req.body?.type;

    // Check valid title and story type
    if (!title || !type) throw CreateError(400, "'title' and 'type' are required");
    if (!ValidateStoryType(type)) throw CreateError(400, "Invalid story type");

    const { nation, status } = req.body;
    const genre = req?.body?.genre ? req.body.genre.split(",") : null;
    if (!ValidateStoryStatus(status) || !ValidateGenre(genre)) throw CreateError(400, "Invalid status or genre");

    const isStoryExist = await FindStory({ title: title });
    if (isStoryExist.data) throw CreateError(400, "Story title already exists");

    // Create and add cover art for story
    if (req.file) {
      const newFileName = "cover_art" + path.extname(req.file.filename);
      const newFolderPath = `${DIRECTORY.UPLOADS_STORY}/${type}/${title}`;
      const newFilePath = `${newFolderPath}/${newFileName}`;
      await CreateNewFolder(newFolderPath);
      await MoveFile(req.file.path, newFilePath);

      var image = await AddImage({ url: newFilePath }); // Update image to db
    }

    // Add new story
    const story = await AddStory({ title: title, type: type, nation: nation, status: status, posterId: userId, genres: genre, coverArtId: image.data.id });

    if (!story || !story.success || !story.data) throw CreateError();

    return res.status(200).json({
      success: true,
      message: "Post new story successfully",
      data: story.data,
    });
  } catch (error) {
    next(error);
  }
}

export async function PutStory(req, res, next) {
  try {
    const storyId = req?.params?.id;

    const body = req?.body;

    const title = body.title;
    const type = body.type;
    const nation = body.nation;
    const status = body.status;
    const view = body.view;
    const summary = body.summary;
    const nextChapterIn = body.nextChapterIn;
    const genres = body.genres ? body.genres.split(",") : null;
    const authorIds = body.authorIds ? body.authorIds.split(",") : null;

    const update = await UpdateStory(storyId, { title, type, view, summary, nation, status, nextChapterIn, genres, authorIds });

    return res.status(200).json({
      success: true,
      message: "Update story successfully",
      data: update.data,
    });
  } catch (err) {
    next(err);
  }
}

export async function DeleteStory(req, res, next) {
  try {
    const userId = req.user.id;
    const storyId = req.params?.id;
    if (!storyId) throw CreateError(400, "'id' is required");

    const removing = await SoftDeleteStory({ id: storyId });
    if (!removing) throw CreateError();

    return res.status(200).json({
      success: true,
      message: "Delete story successfully",
    });
  } catch (error) {
    next(error);
  }
}
