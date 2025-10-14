import db from "../configs/db.js";

export const GetStoryTree = async (story_id, isGettingContent = false) => {
  const nodes = await db.storyNode.findMany({
    where: {
      is_deleted: false,
      OR: [{ parent_id: story_id }, { story_id: story_id }],
    },
    select: {
      id: true,
      title: true,
      view: true,
      order_index: true,
      update_at: true,
      type: true,
      ...(isGettingContent && { content: true }),
    },
    orderBy: {
      order_index: "desc",
    },
  });

  for (const node of nodes) {
    node.children = await GetStoryTree(node.id, isGettingContent);
  }

  return nodes;
};

export const GetParentStoryNodeTree = async (
  story_node_id,
  isGettingContent = false
) => {
  if (!story_node_id) return null;
  const node = await db.storyNode.findUnique({
    where: { is_deleted: false, id: story_node_id },
    select: {
      id: true,
      parent_id: true,
      title: true,
      type: true,
      order_index: true,
      ...(isGettingContent && { content: true }),
    },
  });
  if (!node) return null;

  node.parent = await GetParentStoryNodeTree(node.parent_id, isGettingContent);
  return node;
};

export const FindAllStories = async (
  where = {},
  orderBy = {},
  take,
  skip,
  isGettingChildren = false,
  isGettingContent = false
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
        story.children = await GetStoryTree(story.id, isGettingContent);
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
  isGettingContent = false
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
        isGettingContent
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
    const result = await db.story.create({ data: data });
    return { success: true, data: result };
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

export const UpdateStory = async (where = { id, title }, data = {}) => {
  try {
    // Check if story exist or not
    const story = await FindStory({ id: where.id, title: where.title });
    if (!story || !story.success || !story.data) {
      return { success: false, data: null };
    }
    // If  exist
    const result = await db.story.update({ where: where, data: data });
    return { success: true, data: result };
  } catch (error) {
    console.error("❌ [Story.Model.js] Error updating story: ", error);
    return { success: false, error: error.code };
  }
};

export const FindAllStoryNodes = async (
  where = {},
  orderBy = {},
  skip,
  take,
  isGettingChildren = false,
  isGettingContent = false
) => {
  try {
    const nodes = await db.storyNode.findMany({
      where: {
        is_deleted: false,
        ...where,
      },
      ...(orderBy && { orderBy }),
      ...(take && { take }),
      ...(skip && { skip }),
      select: {
        id: true,
        story_id: true,
        parent_id: true,
        title: true,
        type: true,
        order_index: true,
        view: true,
        number_of_children: true,
        update_at: true,
        ...(isGettingChildren && { number_of_children: true }),
        ...(isGettingContent && { content: true }),
      },
    });

    if (isGettingChildren)
      for (const node of nodes) {
        node.children = await GetStoryTree(node.id, isGettingContent);
      }

    return { success: true, data: nodes };
  } catch (error) {
    console.error("❌ [Story.Model.js] Error finding all story nodes: ", error);
    return { success: false, error: error.code };
  }
};

export const FindStoryNode = async (
  where = { id, story_id, parent_id, order_index },
  isGettingChildren = false,
  isGettingContent = false
) => {
  try {
    if (!where.id && !where.story_id && !where.parent_id && !where.order_index)
      return { success: false, data: null };
    const node = (
      await FindAllStoryNodes(
        where,
        null,
        0,
        1,
        isGettingChildren,
        isGettingContent
      )
    ).data[0];
    return { success: true, data: node };
  } catch (error) {
    console.error("❌ [StoryNode.Model.js] Error finding story nodes:", error);
    return { success: false, error: error.code };
  }
};

export const AddStoryNode = async (
  data = { title, type, story_id, parent_id, order_index }
) => {
  try {
    // Check if story node exist or not
    const storyNode = await FindStoryNode({
      story_id: data.story_id,
      parent_id: data.parent_id,
      order_index: data.order_index,
    });
    if (storyNode && storyNode.success && storyNode.data) {
      return { success: false, data: storyNode.data };
    }

    // If story node does not exist
    const result = await db.storyNode.create({
      data: {
        ...(data.story_id && {
          story: {
            connect: {
              id: data.story_id,
            },
          },
        }),
        ...(data.parent_id && {
          parent: {
            connect: {
              id: data.parent_id,
            },
          },
        }),
        title: data.title,
        type: data.type,
        order_index: data.order_index,
      },
    });

    // Update number of children for parent node
    if (data.parent_id) {
      const ans = await UpdateStoryNode(
        { id: data.parent_id },
        { number_of_children: { increment: 1 } }
      );
    } else {
      // Update number of children for story
      await UpdateStory(
        { id: data.story_id },
        { number_of_children: { increment: 1 } }
      );
    }
    return { success: true, data: result };
  } catch (error) {
    console.error("❌ [StoryNode.Model.js] Error adding story nodes:", error);
    return { success: false, error: error.code };
  }
};

export const SoftDeleteStoryNode = async (where = { id }) => {
  try {
    const storyNode = await FindStoryNode({ id: where.id });
    if (!storyNode || !storyNode.success || !storyNode.data) {
      return { success: false, data: null };
    }

    const result = await db.storyNode.update({
      where: where,
      data: { is_deleted: true },
    });
    return { success: true, data: result };
  } catch (error) {
    console.error(
      "❌ [StoryNode.Model.js] Error soft delete story nodes:",
      error
    );
    return { success: false, error: error.code };
  }
};

export const HardDeleteStoryNode = async (where = { id }) => {
  try {
    const result = await db.storyNode.delete({ where: where });
    return { success: true, data: result };
  } catch (error) {
    console.error(
      "❌ [StoryNode.Model.js] Error hard delete story nodes:",
      error
    );
    return { success: false, error: error.code };
  }
};

export const UpdateStoryNode = async (where = { id }, data = {}) => {
  try {
    // Check if story node exist or not
    const storyNode = await FindStoryNode({ id: where.id });
    if (!storyNode || !storyNode.success || !storyNode.data) {
      return { success: false, data: null };
    }
    // If exist
    const result = await db.storyNode.update({ where: where, data: data });
    return { success: true, data: result };
  } catch (error) {
    console.error("❌ [StoryNode.Model.js] Error updating story nodes:", error);
    return { success: false, error: error.code };
  }
};

export async function FindComments(
  where = { id, user_id, story_id, story_node_id },
  orderBy,
  take = 1,
  skip = 0
) {
  try {
    const comments = await db.comment.findMany({
      where: { is_deleted: false, ...where },
      ...(orderBy ? { orderBy: orderBy } : { orderBy: { create_at: "desc" } }),
      take: take,
      skip: skip,
      select: {
        id: true,
        user_id: true,
        story_id: true,
        story_node_id: true,
        message: true,
        created_at: true,
      },
    });
    return { success: true, data: comments };
  } catch (error) {
    console.error("❌ [User.Model.js] Error finding comment", error);
    return { success: false, error: error.code };
  }
}

export async function AddComment(
  data = { user_id, story_id, story_node_id, message }
) {
  try {
    if (
      !data.story_id ||
      !data.user_id ||
      !data.message ||
      !data.message.length === 0
    )
      return { success: false, data: null };

    const newComment = await db.comment.create({ data: data });
    return { success: true, data: newComment };
  } catch (error) {
    console.error("❌ [User.Model.js] Error adding new comment: ", error);
    return { success: false, error: error.code };
  }
}
