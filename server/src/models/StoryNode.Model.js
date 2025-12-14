import db from "../configs/db.js";
import { StoryNodeType } from "../configs/db.js";

import { GetStoryTree, UpdateStory } from "./Story.Model.js";

export function GetAllStoryNodeType() {
  return Object.values(StoryNodeType);
}

export function ValidateStoryNodeType(storyNodeType) {
  if (!storyNodeType) return true;
  const storyNodeTypeList = GetAllStoryNodeType();
  return storyNodeTypeList.includes(storyNodeType);
}

export const GetParentStoryNodeTree = async (story_node_id, isGettingContent = false) => {
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

export async function FindAllStoryNodes({ id, storyId, parentId, sort, page, limit, isGettingChildren = false }) {
  const storyNodes = await db.storyNode.findMany({
    where: {
      is_deleted: false,
      id: id,
      story_id: storyId,
      parent_id: parentId,
    },
    // orderBy: [sort, { created_at: "desc" }, { id: "desc" }],
    take: limit,
    skip: (page - 1) * limit,
  });

  if (isGettingChildren)
    for (const node of storyNodes) {
      node.children = await GetStoryTree(node.story_id, node.id);
    }

  return { success: true, data: storyNodes };
}

export async function FindStoryNode({ id, storyId, parentId, orderIndex, isGettingChildren = false }) {
  const storyNode = (await FindAllStoryNodes({ id, storyId, parentId, orderIndex, page: 1, limit: 1, isGettingChildren })).data[0];
  return { success: true, data: storyNode };
}

export const AddStoryNode = async (data = { title, type, story_id, parent_id, order_index, poster_id, content }) => {
  let result;
  try {
    // If story node does not exist
    result = await db.storyNode.create({
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
        ...(data.poster_id && {
          poster: {
            connect: {
              id: data.poster_id,
            },
          },
        }),
        ...(data.content && { content: data.content }),
        title: data.title,
        type: data.type || console.log(data.type),
        order_index: data.order_index,
        number_of_children: data.number_of_children,
      },
      select: {
        id: true,
        story_id: true,
        parent_id: true,
        title: true,
        type: true,
        order_index: true,
        updated_at: true,
        created_at: true,
        poster_id: true,
      },
    });

    // Update number of children for parent node
    if (data.parent_id) {
      const ans = await UpdateStoryNode({ id: data.parent_id }, { number_of_children: { increment: 1 } });
    } else {
      // Update number of children for story
      await UpdateStory({ id: data.story_id }, { number_of_children: { increment: 1 } });
    }
    return { success: true, data: result };
  } catch (error) {
    if (error.code !== "P2002") console.error("❌ [StoryNode.Model.js] Error adding story nodes:", error);
    return { success: false, error: error.code, data: result };
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
    console.error("❌ [StoryNode.Model.js] Error soft delete story nodes:", error);
    return { success: false, error: error.code };
  }
};

export const HardDeleteStoryNode = async (where = { id }) => {
  try {
    const result = await db.storyNode.delete({ where: where });
    return { success: true, data: result };
  } catch (error) {
    console.error("❌ [StoryNode.Model.js] Error hard delete story nodes:", error);
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
    const result = await db.storyNode.update({
      where: where,
      data: data,
      select: {
        id: true,
      },
    });
    return { success: true, data: result };
  } catch (error) {
    console.error("❌ [StoryNode.Model.js] Error updating story nodes:", error);
    return { success: false, error: error.code };
  }
};
