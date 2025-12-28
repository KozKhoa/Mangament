import db from "../configs/db.js";

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
  sort = { created_at: "desc" },
  isGettingChildren = false,
  isGettingNewestChapter = false,
}) {
  const stories = await db.story.findMany({
    where: {
      is_deleted: false,
      ...(keyword && { title: { contains: keyword, mode: "insensitive" } }),
      ...(type && type.length > 0 && { type: { in: type } }),
      ...(genres && genres.length > 0 && { genres: { hasEvery: genres } }),
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
    },
    include: {
      authors: {
        select: { author: { select: { id: true, name: true } } },
      },
      cover_art: true,
    },
    orderBy: [sort, { created_at: "desc" }, { id: "desc" }],
    take: limit,
    skip: (page - 1) * limit,
  });

  for (const story of stories) {
    story.authors = story.authors.map((author) => author.author);
    if (isGettingChildren) story.children = await GetStoryTree(story.id, null, false);
    if (isGettingNewestChapter) {
      story.newest_chapter = await GetNewestChapter(story.id, 5);
    }
  }

  return { success: true, data: stories };
}

export async function FindStory({ id, title, isGettingChildren = false, isGettingContent = false, isGettingNewestChapter = false }) {
  const story = await db.story.findUnique({
    where: { ...(id && { id: id }), ...(title && { title: title }), is_deleted: false },
    include: { authors: { select: { author: { select: { id: true, name: true } } } }, cover_art: true },
  });

  if (!story) {
    return { success: false, data: null };
  }

  story.authors = story.authors.map((author) => author.author);

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

export const UpdateStory = async (where = { id, title }, data) => {
  try {
    // Check if story exist or not
    const story = await FindStory(where);
    if (!story || !story.success || !story.data) {
      return { success: false, data: null };
    }
    // If exist
    const result = await db.story.update({
      where: where,
      data: data,
      select: {
        id: true,
      },
    });
    return {
      success: true,
      data: result,
    };
  } catch (error) {
    console.error("❌ [Story.Model.js] Error updating story: ", error);
    return { success: false, error: error.code };
  }
};

export async function CountStory(where = {}) {
  try {
    const count = await db.story.count({ where: { is_deleted: false, ...where } });
    return { success: true, data: count };
  } catch (error) {
    if (error.code !== "P2025") console.error("❌ [Rating.Model.js] Error updating rating:", error);
    return { success: false, error: error.code };
  }
}
