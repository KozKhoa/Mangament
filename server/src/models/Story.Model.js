import db from "../configs/db.js";

export const FindStory = async ({ id, title }) => {
  try {
    const result = await db.story.findMany({
      where: {
        is_deleted: false,
        ...(id && { id }),
        ...(title && { title }),
      },
    });
    return { success: true, data: result };
  } catch (error) {
    console.error("❌ [Story.Model.js] Error finding story: ", error);
    return { success: false, error: error.code };
  }
};

export const AddStory = async (data = {}) => {
  try {
    const result = await db.story.create({ data: data });
    return { success: true, data: result };
  } catch (error) {
    console.error("❌ [Story.Model.js] Error adding story: ", error);
    return { success: false, error: error.code };
  }
};

export const SoftDeleteStory = async ({ id, title }) => {
  try {
    let result;
    if (id) {
      result = await db.story.update({
        where: { id: id },
        data: { is_deleted: true },
      });
    } else if (title) {
      result = await db.story.update({
        where: { title: title },
        data: { is_deleted: true },
      });
    }
    return { success: true, data: result };
  } catch (error) {
    console.error("❌ [Story.Model.js] Error soft delete story: ", error);
    return { success: false, error: error.code };
  }
};

export const HardDeleteStory = async ({ id, title }) => {
  try {
    let result;
    if (id) {
      result = await db.story.delete({ where: { id: id } });
    } else if (title) {
      result = await db.story.delete({ where: { title: title } });
    }
    return { success: true, data: result };
  } catch (error) {
    console.error("❌ [Story.Model.js] Error hard delete story: ", error);
    return { success: false, error: error.code };
  }
};

export const UpdateStory = async ({ id, title, data = {} }) => {
  try {
    let result;
    if (id) {
      result = await db.story.update({ where: { id: id }, data: data });
    } else if (title) {
      result = await db.story.update({ where: { title: title }, data: data });
    }
    return { success: true, data: result };
  } catch (error) {
    console.error("❌ [Story.Model.js] Error updating story: ", error);
    return { success: false, error: error.code };
  }
};

export const FindStoryNode = async ({ id }) => {
  try {
    const result = await db.storyNode.findMany({
      where: { is_deleted: false, ...(id && { id }) },
    });
    return { success: true, data: result };
  } catch (error) {
    console.error("❌ [StoryNode.Model.js] Error finding story nodes:", error);
    return { success: false, error: error.code };
  }
};

export const AddStoryNode = async ({
  title,
  type,
  story_id,
  parent_id,
  ...props
}) => {
  try {
    const result = await db.storyNode.create({
      data: {
        ...(story_id && {
          story: {
            connect: {
              id: story_id,
            },
          },
        }),
        ...(parent_id && {
          parent: {
            connect: {
              id: parent_id,
            },
          },
        }),
        title,
        type,
        ...props,
      },
    });
    return { success: true, data: result };
  } catch (error) {
    console.error("❌ [StoryNode.Model.js] Error adding story nodes:", error);
    return { success: false, error: error.code };
  }
};

export const SoftDeleteStoryNode = async ({ id }) => {
  try {
    const result = await db.storyNode.update({
      where: { id: id },
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

export const HardDeleteStoryNode = async ({ id }) => {
  try {
    const result = await db.storyNode.delete({ where: { id: id } });
    return { success: true, data: result };
  } catch (error) {
    console.error(
      "❌ [StoryNode.Model.js] Error hard delete story nodes:",
      error
    );
    return { success: false, error: error.code };
  }
};

export const UpdateStoryNode = async ({ id, data = {} }) => {
  try {
    const result = await db.storyNode.update({ where: { id: id }, data: data });
    return { success: true, data: result };
  } catch (error) {
    console.error("❌ [StoryNode.Model.js] Error updating story nodes:", error);
    return { success: false, error: error.code };
  }
};
