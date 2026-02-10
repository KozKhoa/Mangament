import db from "../configs/db.js";
import { CreateError } from "../utils/ErrorHandle.js";
import { randomInt } from "../utils/Number.js";
import { ValidateStoryType } from "./Enum.Model.js";
import { ValidateGenre } from "./Genre.Model.js";

import { validate as isUUID } from "uuid";

export async function BuildStoryTree(storyId, storyNodeId, isGettingContent = false) {
  const storyNodes = await db.storyNode.findMany({
    where: {
      is_deleted: false,
      story: {
        is: { id: storyId, is_deleted: false },
      },
      ...(storyNodeId && { parent_id: storyNodeId }),
    },
    orderBy: { order_index: "asc" },
  });

  const map = new Map();
  for (const node of storyNodes) {
    map.set(node.id, { ...node, children: [] });
  }

  const tree = [];
  for (const node of map.values()) {
    if (node.parent_id) {
      map.get(node.parent_id)?.children.push(node);
    } else {
      tree.push(node);
    }
  }

  return tree;
}

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
  status = [],
  page = 1,
  limit = 10,
  sort = { updated_at: "desc" },
  isActived,
  isGettingChildren = false,
  isGettingNewestChapter = false,
}) {
  const where = {
    is_deleted: false,
    is_actived: isActived,
    ...(keyword && { title: { contains: keyword, mode: "insensitive" } }),
    ...(type && type.length > 0 && { type: { in: type } }),
    ...(genres && genres.length > 0 && { genres: { some: { genre: { in: genres } } } }),
    ...(authorsId && authorsId.length > 0 && { authors: { some: { author_id: { in: authorsId } } } }),
    ...(status && status.length > 0 && { status: { in: status } }),
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
    if (isGettingChildren) story.children = await BuildStoryTree(story.id, null, false);
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
      pageSize: stories.length,
      totalPages: Math.ceil(totalItems / limit),
      totalItems: totalItems,
    },
  };
}

export async function FindStory({ id, title, isGettingChildren = false, isGettingContent = false, isGettingNewestChapter = false }) {
  const story = await db.story.findUnique({
    where: { ...(id && { id: id }), ...(title && { title: title }), is_deleted: false, is_actived: true },
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
    story.children = await BuildStoryTree(story.id, null, isGettingContent);
  }

  if (isGettingNewestChapter) {
    story.newest_chapter = await GetNewestChapter(story.id, 5);
  }

  return { success: true, data: story };
}

export async function AddStory({ title, type, nation, genres, authorIds, status, posterId, summary, coverArtUrl }) {
  if (!title || !type) throw CreateError(400, "'title' and 'type' are required");

  return db.$transaction(async (db) => {
    // Check if story exist or not;
    const story = await db.story.findUnique({ where: { title: title } });
    if (story) throw CreateError(409, "Story already exist");

    if (authorIds) {
      const authors = await db.author.findMany();
      const authorsSet = new Set(authors.map((author) => author.id));

      const invalidAuthors = [];
      for (const author of authorIds) {
        if (!authorsSet.has(author)) invalidAuthors.push(author);
      }

      if (invalidAuthors.length > 0) throw CreateError(400, `${invalidAuthors.join(",")} ${invalidAuthors.length > 1 ? "are" : "is"} not exist`);
    }

    // If not exist
    const newStory = await db.story.create({
      data: {
        ...(title && { title: title }),
        ...(type && { type: type }),
        ...(nation && { nation: nation }),
        ...(genres && { genres: genres }),
        ...(status && { status: status }),
        ...(summary && { summary: summary }),
        ...(posterId && { poster: { connect: { id: posterId } } }),
        ...(authorIds && { authors: { connectOrCreate: authorIds.map((authorId) => ({ author_id: authorId })) } }),
        ...(coverArtUrl && { cover_art: { connectOrCreate: { where: { url: coverArtUrl }, create: { url: coverArtUrl } } } }),
      },
    });

    return { success: true, data: newStory };
  });
}

export async function SoftDeleteStory({ id, title }) {
  if (!(id || title)) throw new Error("Require at least id or title");

  const where = {
    ...(id && { id: id }),
    ...(title && { title: title }),
  };

  return await db.$transaction(async (db) => {
    const story = await db.story.findFirst({ where: where });
    if (!story) throw CreateError(404, "Story not found");

    const softDelete = await db.story.update({ where: where, data: { is_deleted: true } });

    return { success: true, data: softDelete };
  });
}

export async function HardDeleteStory({ id, title }) {
  if (!(id || title)) throw new Error("Require at least id or title");

  const where = {
    ...(id && { id: id }),
    ...(title && { title: title }),
  };

  return await db.$transaction(async (db) => {
    const story = await db.story.findFirst({ where: where });
    if (!story) throw CreateError(404, "Story not found");

    const hardRemove = await db.story.delete({ where: where });

    return { success: true, data: hardRemove };
  });
}

export async function ActiveStory({ storyId, isActived }) {
  if (typeof isActived !== "boolean") throw CreateError(400, "'isActived' must be boolean");

  const story = await db.story.findFirst({ where: { id: storyId, is_deleted: false } });

  if (!story) throw CreateError(400, "Story not found");

  const active = await db.story.update({
    where: { id: storyId, is_deleted: false },
    data: { is_actived: isActived },
    include: { cover_art: { select: { url: true, height: true, width: true } } },
  });

  return { success: true, data: active };
}

export async function UpdateStory(id, { title, type, view, summary, posterId, nation, status, genres = [], coverArtUrl, nextChapterIn, authorIds = [] }) {
  return await db.$transaction(async function (tx) {
    const story = await tx.story.findFirst({ where: { id: id, is_deleted: false } });
    if (!story) {
      throw new Error("Story not found");
    }

    if (title && title !== story.title) {
      const isTitleExist = await tx.story.findFirst({ where: { title: title, NOT: { id: id } } });
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
  if (!storyId) throw new Error("Require id");

  const story = await db.story.update({
    where: { id: storyId },
    data: { view: { increment: 1 } },
  });

  return { success: true, data: story };
}

export async function CountStory() {
  const count = await db.story.count({ where: { is_deleted: false, is_actived: true } });
  return { success: true, data: count };
}

export async function FindRandomStory() {
  const stories = await db.story.findMany({
    where: { is_deleted: false, is_actived: true },
    select: { id: true, title: true, type: true },
  });

  const random = randomInt(0, stories.length);

  return { success: true, data: stories[random] };
}
