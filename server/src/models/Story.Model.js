import db from "../configs/db.js";

export const FindAllStories = async (where = {}, orderBy = {}, take, skip) => {
  try {
    const result = await db.story.findMany({
      where: {
        is_deleted: false,
        ...where,
      },
      ...(orderBy && { orderBy }),
      ...(take && { take }),
      ...(skip && { skip }),
    });
    return { success: true, data: result };
  } catch (error) {
    console.error("❌ [Story.Model.js] Error finding add stories: ", error);
    return { success: false, error: error.code };
  }
};

export const FindStory = async (where = { id, title }) => {
  try {
    if (!where.id && !where.title) return { success: false, data: null };
    const result = await db.story.findFirst({
      where: {
        is_deleted: false,
        ...where,
      },
    });
    return { success: true, data: result };
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
  take
) => {
  try {
    const result = await db.storyNode.findMany({
      where: {
        is_deleted: false,
        ...where,
      },
      ...(orderBy && { orderBy }),
      ...(take && { take }),
      ...(skip && { skip }),
    });
    return { success: true, data: result };
  } catch (error) {
    console.error("❌ [Story.Model.js] Error finding all story nodes: ", error);
    return { success: false, error: error.code };
  }
};

export const FindStoryNode = async (
  data = { id, story_id, parent_id, order_index }
) => {
  try {
    if (!data.id && !data.story_id && !data.parent_id && !data.order_index)
      return { success: false, data: null };
    const result = await db.storyNode.findFirst({
      where: {
        is_deleted: false,
        ...data,
      },
    });
    return { success: true, data: result };
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
