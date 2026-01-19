import db from "../configs/db.js";
import { StoryNodeType } from "../configs/db.js";

import { BuildStoryTree, UpdateStory } from "./Story.Model.js";

export function GetAllStoryNodeType() {
  return Object.values(StoryNodeType);
}

export function ValidateStoryNodeType(storyNodeType) {
  if (!storyNodeType) return true;
  const storyNodeTypeList = GetAllStoryNodeType();
  return storyNodeTypeList.includes(storyNodeType);
}

export const GetParentStoryNodeTree = async (storyId, storyNodeId, isGettingContent = false) => {
  if (!storyId) throw new Error("Require story id");
  if (!storyNodeId) throw new Error("Require story node id");

  const nodes = await db.storyNode.findMany({
    where: {
      is_deleted: false,
      story_id: storyId,
    },
    select: {
      id: true,
      story_id: true,
      parent_id: true,
      type: true,
      order_index: true,
      updated_at: true,
      created_at: true,
      ...(isGettingContent && { content: true }),
    },
  });

  const map = new Map();
  for (const node of nodes) {
    map.set(node.id, { ...node, parent: null });
  }

  let node = map.get(storyNodeId);
  while (node) {
    map.get(node.id).parent = map.get(node.parent_id);
    node = map.get(node.parent_id);
  }

  return map.get(storyNodeId);
};

export async function FindAllStoryNodes({ storyId, parentId, sort = { updated_at: "desc" } }, page = 1, limit = 10, isGettingChildren = false) {
  const where = {
    is_deleted: false,

    ...(storyId && { story: { is_deleted: false, id: storyId } }),
    ...(parentId && { parent: { is_deleted: false, id: parentId } }),
  };

  const storyNodes = await db.storyNode.findMany({
    where: where,
    orderBy: [sort, { id: "asc" }],
    take: limit,
    skip: (page - 1) * limit,
  });

  const totalItems = await db.storyNode.count({ where: where });

  if (isGettingChildren) {
    for (const node of storyNodes) {
      node.children = await BuildStoryTree(node.story_id, node.id);
    }
  }

  return {
    success: true,
    data: storyNodes,
    pagination: {
      page: page,
      pageSize: limit,
      totalPages: Math.ceil(totalItems / limit),
      totalItems: totalItems,
    },
  };
}

export async function FindStoryNode({ id, storyId, parentId, storyNodeType, orderIndex, isGettingChildren = false }) {
  if (!(id || (storyId && storyNodeType && orderIndex && parentId))) {
    throw new Error("Require id or (story id, story node type, story node's parent id and order index)");
  }

  const storyNode = await db.storyNode.findFirst({
    where: {
      is_deleted: false,

      ...(id && { id: id }),
      ...(storyId && { story_id: storyId }),
      ...(parentId && { parent_id: parentId }),
      ...(storyNodeType && { type: storyNodeType }),
      ...(orderIndex && { order_index: orderIndex }),
    },
  });

  if (isGettingChildren) {
    storyNode.children = await BuildStoryTree(node.story_id, node.id);
  }

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

export async function IncreaseOneViewForStoryNodeAndItsParents(storyNodeId) {
  if (!storyNodeId) throw new Error("Require story node id");

  //  Update view for current story node
  const update = await db.storyNode.update({
    where: { id: storyNodeId, is_deleted: false },
    data: { view: { increment: 1 } },
  });

  // Udpate view for story
  await db.story.update({
    where: { is_deleted: false, id: update.story_id },
    data: { view: { increment: 1 } },
  });

  // Update for current node's parents
  let parentId = update.parent_id;
  while (parentId) {
    const update = await db.storyNode.update({
      where: { id: parentId, is_deleted: false },
      data: { view: { increment: 1 } },
    });

    parentId = update.parent_id;
  }

  return { success: true, data: update };
}

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
