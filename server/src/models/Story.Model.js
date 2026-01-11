import db from "../configs/db.js";
import { ValidateStoryType } from "./Enum.Model.js";
import { ValidateGenre } from "./Genre.Model.js";

import { validate as isUUID } from "uuid";

export const GetStoryTree = async (story_id, parent_id, isGettingContent = false) => {
  const nodes = await db.storyNode.findMany({
    where: {
      is_deleted: false,
      AND: [{ parent_id: parent_id }, { story_id: story_id }],
    },
    select: {
      id: true,
      title: true,
      view: true,
      order_index: true,
      updated_at: true,
      created_at: true,
      type: true,
      ...(isGettingContent && { content: true }),
    },
    orderBy: {
      order_index: "asc",
    },
  });

  for (const node of nodes) {
    node.children = await GetStoryTree(story_id, node.id, isGettingContent);
  }

  return nodes;
};

export async function GetNewestChapter(storyId, number) {
  let count = 0;
  const dfs = async (parentId) => {
    const nodes = await db.storyNode.findMany({
      where: {
        parent_id: parentId,
        story_id: storyId,
      },
      orderBy: {
        order_index: "desc",
      },
      select: {
        id: true,
        title: true,
        order_index: true,
        story_id: true,
        parent_id: true,
        type: true,
        created_at: true,
        updated_at: true,
      },
    });

    const result = [];
    for (const node of nodes) {
      if (count >= number) break;
      result.push(node);

      if (node.type !== "chapter") {
        node.children = await dfs(node.id);
      } else if (node.type === "chapter") {
        node.children = [];
        count++;
      }
    }

    return result;
  };

  const result = await dfs(null);

  return result;
}

export async function GetReview(storyId, number = 1) {
  const imageUrl = [];

  const dfs = async (parentId) => {
    const nodes = await db.storyNode.findMany({
      where: {
        parent_id: parentId,
        story_id: storyId,
      },
      orderBy: {
        order_index: "asc",
      },
      select: {
        id: true,
        type: true,
        story_id: true,
        parent_id: true,
        content: true,
      },
    });

    for (const node of nodes) {
      if (node.type === "chapter") {
        const contents = node.content;
        if (!contents || contents.length <= 0) return;

        for (const content of contents) {
          imageUrl.push(content.image_url);
          if (imageUrl.length >= number) return;
        }
      } else {
        await dfs(node.id);
      }
    }
  };

  await dfs(null);

  return imageUrl.slice(0, 4);
}

export async function FindAllStories({
  keyword,
  type = [],
  view = [[0, 2147483647]],
  star = [[0, 6]],
  genres = [],
  authorsId = [],
  page = 1,
  limit = 10,
  sort = { updated_at: "desc" },
  isGettingChildren = false,
  isGettingNewestChapter = false,
}) {
  const where = {
    is_deleted: false,
    ...(keyword && { title: { contains: keyword, mode: "insensitive" } }),
    ...(type && type.length > 0 && { type: { in: type } }),
    ...(genres &&
      genres.length > 0 && {
        genres: { some: { genre: { in: genres } } },
      }),
    ...(authorsId &&
      authorsId.length > 0 && {
        authors: { some: { author_id: { in: authorsId } } },
      }),
    AND: [
      {
        OR: [...star.map(([min, max]) => ({ star: { gte: min, lte: max } }))],
      },
      {
        OR: [...view.map(([min, max]) => ({ view: { gte: min, lte: max } }))],
      },
    ],
  };

  const stories = await db.story.findMany({
    where: where,
    include: {
      authors: {
        select: { author: { select: { id: true, name: true } } },
      },
      cover_art: {
        select: { url: true, height: true, width: true },
      },
      genres: { select: { genre: true } },
    },
    orderBy: [sort, { updated_at: "desc" }, { id: "desc" }],
    take: limit,
    skip: (page - 1) * limit,
  });

  const totalItems = await db.story.count({ where: where });

  for (const story of stories) {
    story.authors = story.authors.map((author) => author.author);
    story.genres = story.genres.map((genre) => genre.genre);
    if (isGettingChildren) story.children = await GetStoryTree(story.id, null, false);
    if (isGettingNewestChapter) {
      story.newest_chapter = await GetNewestChapter(story.id, 5);
    }

    delete story.cover_art_id;
    delete story.poster_id;
  }

  return {
    success: true,
    data: stories,
    pagination: {
      page: page,
      pageSize: limit,
      totalPages: Math.floor(totalItems / limit),
      totalItems: totalItems,
    },
  };
}

export async function FindStory({ id, title, isGettingChildren = false, isGettingContent = false, isGettingNewestChapter = false }) {
  const story = await db.story.findUnique({
    where: { ...(id && { id: id }), ...(title && { title: title }), is_deleted: false },
    include: {
      authors: { select: { author: { select: { id: true, name: true } } } },
      genres: { select: { genre: true } },
      cover_art: {
        select: { url: true, height: true, width: true },
      },
    },
  });

  if (!story) {
    return { success: false, data: null };
  }

  story.authors = story.authors.map((author) => author.author);
  story.genres = story.genres.map((genre) => genre.genre);

  if (isGettingChildren) {
    story.children = await GetStoryTree(story.id, null, isGettingContent);
  }

  if (isGettingNewestChapter) {
    story.newest_chapter = await GetNewestChapter(story.id, 5);
  }

  return { success: true, data: story };
}

export const AddStory = async ({ title, type, nation, genres, authorsId, status, posterId, summary, coverArtId }) => {
  // Check if story exist or not;
  const story = await db.story.findUnique({ where: { title: title } });
  if (story) return { success: false, data: story.data };

  // If not exist
  const newStory = await db.story.create({
    data: {
      title: title,
      type: type,
      nation: nation,
      genres: genres,
      status: status,
      summary: summary,
      ...(posterId && { poster: { connect: { id: posterId } } }),
      ...(authorsId && { authors: { connectOrCreate: authorsId.map((authorId) => ({ author_id: authorId })) } }),
      ...(coverArtId && { cover_art: { connect: { id: coverArtId } } }),
    },
  });

  return { success: true, data: newStory };
};

export const SoftDeleteStory = async (where = { id, title }) => {
  try {
    const story = await FindStory({ id: where.id, title: where.title });
    if (!story || !story.success || !story.data) {
      return { success: false, data: result };
    }

    const result = await db.story.update({
      where: where,
      data: {
        is_deleted: true,
      },
    });
    return { success: true, data: result };
  } catch (error) {
    console.error("❌ [Story.Model.js] Error soft delete story: ", error);
    return { success: false, error: error.code };
  }
};

export const HardDeleteStory = async (where = { id, title }) => {
  try {
    const result = await db.story.delete({ where: where });
    return { success: true, data: result };
  } catch (error) {
    console.error("❌ [Story.Model.js] Error hard delete story: ", error);
    return { success: false, error: error.code };
  }
};

export async function UpdateStory(id, { title, type, view, summary, posterId, nation, status, genres = [], coverArtUrl, nextChapterIn, authorIds = [] }) {
  return await db.$transaction(async function (tx) {
    const story = await tx.story.findFirst({ where: { id: id, is_deleted: false } });
    if (!story) {
      throw new Error("Story not found");
    }

    if (title && title !== story.title) {
      const isTitleExist = await tx.story.findFirst({ where: { title: title, is_deleted: false, NOT: { id: id } } });
      if (isTitleExist) {
        throw new Error("Title already exist");
      }
    }

    if (type && !ValidateStoryType(type)) {
      throw new Error("Invalid story type");
    }

    if (authorIds && authorIds.length > 0) {
      for (const authorId of authorIds) {
        if (!isUUID(authorId)) throw new Error("authorIds must be uuid[]");

        const author = await tx.author.findUnique({ where: { id: authorId } });
        console.log(author);
        if (!author) throw new Error(`Author ${authorId} is not exist`);
      }
    }

    if (genres && genres.length > 0) {
      genres = ValidateGenre(genres);
    }

    const result = await tx.story.update({
      where: { id: id },
      data: {
        ...(title && { title: title }),
        ...(type && { type: type }),
        ...(view !== undefined && { view: view }),
        ...(summary && { summary: summary }),
        ...(nation && { nation: nation }),
        ...(status && { status: status }),
        ...(nextChapterIn && { next_chapter_in: nextChapterIn }),

        ...(coverArtUrl && {
          cover_art: {
            connectOrCreate: {
              where: { url: coverArtUrl },
              create: { url: coverArtUrl },
            },
          },
        }),

        ...(posterId && {
          poster: {
            connect: {
              id: posterId,
            },
          },
        }),
      },
    });

    if (genres && genres.length > 0) {
      await tx.story_Genre.deleteMany({ where: { story_id: story.id } });

      await tx.story_Genre.createMany({
        data: genres.map((genre) => ({
          story_id: story.id,
          genre,
        })),
        skipDuplicates: true,
      });
    }

    if (authorIds && authorIds.length > 0) {
      await tx.story_Author.deleteMany({ where: { story_id: story.id } });

      await tx.story_Author.createMany({
        data: authorIds.map((authorId) => ({
          story_id: story.id,
          author_id: authorId,
        })),
        skipDuplicates: true,
      });
    }

    return { success: true, data: result };
  });
}

export async function AddOneViewForStory(storyId) {
  const story = await db.story.findUnique({ where: { id: storyId } });
  if (!story) return { success: false, message: "Story not found" };

  const update = await db.story.update({
    where: { id: storyId },
    data: {
      view: {
        increment: 1,
      },
    },
  });

  return { success: !!update, data: update };
}

export async function CountStory(where = {}) {
  try {
    const count = await db.story.count({ where: { is_deleted: false, ...where } });
    return { success: true, data: count };
  } catch (error) {
    if (error.code !== "P2025") console.error("❌ [Rating.Model.js] Error updating rating:", error);
    return { success: false, error: error.code };
  }
}
