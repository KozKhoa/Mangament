import db from "../configs/db.js";

export const GetStoryTree = async (
  story_id,
  parent_id,
  isGettingContent = false
) => {
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

export const FindAllStories = async (
  where = {},
  orderBy = {},
  take,
  skip,
  isGettingChildren = false,
  isGettingContent = false,
  isGettingSummary = false
) => {
  try {
    const stories = await db.story.findMany({
      where: {
        is_deleted: false,
        ...where,
      },
      ...(orderBy && { orderBy }),
      ...(take && { take }),
      ...(skip && { skip }),
      select: {
        id: true,
        title: true,
        nation: true,
        view: true,
        star: true,
        type: true,
        status: true,
        next_chapter_in: true,
        number_of_children: true,
        ...(isGettingSummary && {
          summary: true,
        }),
        author: {
          select: {
            author: {
              select: { id: true, name: true },
            },
          },
        },
        genre: true,
        cover_art: {
          select: { url: true, width: true, height: true },
        },
      },
    });

    for (const story of stories) {
      story.author = story.author.map((author) => author.author);
      story.genre = story.genre.map((genre) => genre.genre);
      if (isGettingChildren)
        story.children = await GetStoryTree(story.id, null, isGettingContent);
    }

    const result = stories;
    return { success: true, data: result };
  } catch (error) {
    console.error("❌ [Story.Model.js] Error finding all stories: ", error);
    return { success: false, error: error.code };
  }
};

export const FindStory = async (
  where = { id, title },
  isGettingChildren = false,
  isGettingContent = false,
  isGettingSummary = false
) => {
  try {
    if (!where.id && !where.title) return { success: false, data: null };
    const story = (
      await FindAllStories(
        where,
        null,
        1,
        0,
        isGettingChildren,
        isGettingContent,
        isGettingSummary
      )
    ).data[0];

    return { success: true, data: story };
  } catch (error) {
    console.error("❌ [Story.Model.js] Error finding story: ", error);
    return { success: false, error: error.code };
  }
};

export const AddStory = async (data = { title, type }) => {
  try {
    // Check if story exist or not;
    const story = await FindStory({ title: data.title });
    if (story && story.success && story.data) {
      return { success: false, data: story.data };
    }
    // If not exist
    const newStory = await db.story.create({
      data: data,
      select: {
        id: true,
        title: true,
        nation: true,
        view: true,
        star: true,
        type: true,
        status: true,
        next_chapter_in: true,
        number_of_children: true,
        poster_id: true,
        updated_at: true,
        created_at: true,
        cover_art: {
          select: { url: true, width: true, height: true },
        },
        genre: {
          select: {
            genre: true,
          },
        },
      },
    });

    newStory.genre = newStory.genre.map((genre) => genre.genre);
    return { success: true, data: newStory };
  } catch (error) {
    console.error("❌ [Story.Model.js] Error adding story: ", error);
    return { success: false, error: error.code };
  }
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

export async function CountStory() {
  return await db.story.count();
}
