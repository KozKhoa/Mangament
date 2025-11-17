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

export const FindAllStoryNodes = async (
  where = { id, story_id, parent_id },
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
        updated_at: true,
        created_at: true,
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
  data = { title, type, story_id, parent_id, order_index, poster_id, content }
) => {
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
        type: data.type,
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
    if (error.code !== "P2002")
      console.error("❌ [StoryNode.Model.js] Error adding story nodes:", error);
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
