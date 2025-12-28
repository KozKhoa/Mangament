import path from "path";
import { CreateError } from "../utils/ErrorHandle.js";
import ErrorCodes from "../constants/Error.js";
import { ValidateStoryType, ValidateStoryStatus } from "../models/Enum.Model.js";

import { AddManyStoryGenres, HardDeleteStoryGenre, ValidateGenre } from "../models/Genre.Model.js";
import { AddImage, UpdateImage } from "../models/Image.Model.js";
import {
  FindAllStories,
  FindStory,
  UpdateStory,
  AddStory,
  SoftDeleteStory,
  CountStory,
  GetNewestChapter,
  GetStoryTree,
  GetReview,
} from "../models/Story.Model.js";

import { FindAllFavouriteStories, FindFavouriteStory } from "../models/Favourite.Model.js";

import { CreateNewFolder, IsFileExist, MoveFile, SoftRemoveFile } from "../utils/FileHandle.js";
import DIRECTORY from "../constants/Directory.js";
import { ConvertQuery } from "../utils/QueryConvert.js";

export async function GetStory(req, res, next) {
  try {
    const userId = req.user?.id;
    const storyId = req?.params?.id;

    // Check user request
    if (!storyId) throw CreateError(ErrorCodes.BAD_REQUEST);

    const { type, isGettingChildren, isGettingContent, isGettingSummary, isGettingNewestChapter } = ConvertQuery(req.query);

    const story = await FindStory({
      id: storyId,
      isGettingChildren: isGettingChildren,
      isGettingContent: isGettingContent,
      isGettingNewestChapter: isGettingNewestChapter,
    });

    // If server not return anything or return success = false => fail to find story
    if (!story || !story.success) throw CreateError(ErrorCodes.INTERNAL_SERVER_ERROR);

    if (!story.data) throw CreateError(ErrorCodes.STORY_NOT_FOUND);

    // Format story.favourite
    if (userId) {
      const favourite = await FindFavouriteStory({ userId: userId, storyId: story.data.id });

      if (favourite && favourite.data) {
        story.data.favourite = { id: favourite.data.id };
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

    if (!storyId) throw CreateError(ErrorCodes.BAD_REQUEST);

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
    if (!ValidateGenre(genres)) throw CreateError(ErrorCodes.BAD_REQUEST);

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
    const count = (await CountStory()).data;
    const random = parseInt(((Math.random() * count * 100) % count) + 1);

    const story = await FindAllStories({ page: random, limit: 1, isGettingChildren: true });

    if (!story || !story.success) throw CreateError(ErrorCodes.INTERNAL_SERVER_ERROR);

    return res.status(200).json({
      success: true,
      message: "Get random story successfully",
      data: {
        id: story.data[0].id,
        type: story.data[0].type,
      },
    });
  } catch (error) {
    next(error);
  }
}

export async function GetAllStories(req, res, next) {
  try {
    const userId = req?.user?.id;

    const { isGettingChildren, authors, keyword, isGettingNewestChapter, limit, page, type, genres, rating, view, sort } = ConvertQuery(req.query);

    const stories = await FindAllStories({
      keyword: keyword,
      type: type,
      view: view,
      star: rating,
      genres: genres,
      genres: genres,
      authorsId: authors,
      sort: sort,
      page: page,
      limit: limit,
      isGettingChildren: isGettingChildren,
      isGettingNewestChapter: isGettingNewestChapter,
    });

    if (!stories || !stories.success) {
      throw CreateError(ErrorCodes.INTERNAL_SERVER_ERROR);
    }

    if (userId) {
      const favourites = await FindAllFavouriteStories({
        userId: userId,
        limit: 2147483647,
        page: 1,
        storyType: type,
        star: rating,
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
    });
  } catch (error) {
    next(error);
  }
}

export async function AddOneViewForStory(req, res, next) {
  try {
    const storyId = req?.params?.id;
    if (!storyId) throw CreateError(ErrorCodes.BAD_REQUEST);

    // Make sure story exist
    const story = await FindStory({ id: storyId });
    if (!story || !story.success || !story.data) throw CreateError(ErrorCodes.STORY_NOT_FOUND);

    const update = await UpdateStory({ id: storyId }, { view: { increment: 1 } });
    if (!update || !update.success) throw CreateError(ErrorCodes.INTERNAL_SERVER_ERROR);

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
    if (!title || !type) throw CreateError(ErrorCodes.MISSING_FIELD);
    if (!ValidateStoryType(type)) throw CreateError(ErrorCodes.BAD_REQUEST);

    const { nation, status } = req.body;
    const genre = req?.body?.genre ? req.body.genre.split(",") : null;
    if (!ValidateStoryStatus(status) || !ValidateGenre(genre)) throw CreateError(ErrorCodes.BAD_REQUEST);

    const isStoryExist = await FindStory({ title: title });
    if (isStoryExist.data) throw CreateError(ErrorCodes.ASSET_ALREADY_EXIST);

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

    if (!story || !story.success || !story.data) throw CreateError(ErrorCodes.INTERNAL_SERVER_ERROR);

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
    // Get infor from body
    const userId = req.user.id;
    const storyId = req.params?.id;
    if (!storyId) throw CreateError(ErrorCodes.BAD_REQUEST);

    // Make sure story exist
    const story = await FindStory({ id: storyId });
    if (!story || !story.success || !story.data) throw CreateError(ErrorCodes.STORY_NOT_FOUND);

    const { title, nation, status, view, star, nextChapterIn, summary } = req.body;
    const genre = req?.body?.genre ? req.body.genre.split(",") : null;

    // Make sure all values are valid
    if (!ValidateStoryStatus(status) || !ValidateGenre(genre)) throw CreateError(ErrorCodes.INVALID_INPUT);
    const isTitleExist = await FindStory({ title: title });
    if (isTitleExist.data) throw CreateError(ErrorCodes.TITLE_ALDREADY_EXIST);
    if (nextChapterIn && !new Date(nextChapterIn)) throw CreateError(ErrorCodes.INVALID_INPUT);

    if (req.file) {
      // Create and add cover art for story
      const fileName = "cover_art" + path.extname(req.file.filename);
      const folderPath = `${DIRECTORY.UPLOADS_STORY}/${story.data.type}/${story.data.title}`;
      const filePath = `${folderPath}/${fileName}`;

      if (await IsFileExist(filePath)) {
        const delteFilePath = SoftRemoveFile(filePath); // remove the previous image
        await MoveFile(req.file.path, filePath); // move new file to its path
        // soft delete old image in db
        await UpdateImage({ url: filePath }, { url: delteFilePath, is_deleted: true });
      }

      var image = await AddImage({ url: filePath }); // Update image to db
    }

    const update = await UpdateStory(
      { id: storyId },
      {
        ...(title && { title: title }),
        ...(nation && { nation: nation }),
        ...(view && { view: Number(view) }),
        ...(star && { star: Float64Array(star) }),
        ...(status && { status: status }),
        ...(nextChapterIn && { next_chapter_in: new Date(nextChapterIn) }),
        ...(summary && { summary: summary }),
        ...(image &&
          image.success &&
          image.data && {
            cover_art: {
              connect: {
                id: image.data.id,
              },
            },
          }),
        updated_at: new Date(),
      }
    );

    // Due to its complex, genre will be updated later
    if (genre) {
      const deleteGenre = await HardDeleteStoryGenre({ story_id: storyId });
      const addGenre = await AddManyStoryGenres(genre.map((element) => ({ story_id: storyId, genre: element })));
    }

    if (!update || !update.success) throw CreateError(ErrorCodes.INTERNAL_SERVER_ERROR);

    return res.status(200).json({
      success: true,
      message: "Update story successfully",
      data: update.data,
    });
  } catch (error) {
    next(error);
  }
}

export async function DeleteStory(req, res, next) {
  try {
    const userId = req.user.id;
    const storyId = req.params?.id;
    if (!storyId) throw CreateError(ErrorCodes.BAD_REQUEST);

    const removing = await SoftDeleteStory({ id: storyId });
    if (!removing) throw CreateError(ErrorCodes.INTERNAL_SERVER_ERROR);

    return res.status(200).json({
      success: true,
      message: "Delete story successfully",
    });
  } catch (error) {
    next(error);
  }
}
