import db from "../configs/db.js";
import { StoryNodeType } from "../configs/db.js";
import { redis } from "../configs/redis.js";
import redisService from "../services/redis.service.js";
import { CreateError } from "../utils/ErrorHandle.js";

import { BuildStoryTree, UpdateStory } from "./Story.Model.js";

import { isUUID } from "../utils/Validators.js";

const REDIS_TTL = 60 * 30; // 30 minutes

// Lấy danh sách parent của mọt story node (không lấy bản thân story đó)
export async function GetParentStoryNodeTree(storyId, storyNodeId, isGettingContent = false) {
  const storiesVer = await redisService.stories(storyId).get();
  const storyNodeVer = await redisService.storyNodes(storyNodeId).get();

  const REDIS_KEY = [
    "GetParentStoryNodeTree",
    "storiesVer=" + storiesVer,
    "storyNodeVer=" + storyNodeVer,
    "storyId=" + storyId,
    "storyNodeId=" + storyNodeId,
    "isGettingContent=" + isGettingContent,
  ].join(":");

  const cached = await redis.get(REDIS_KEY);
  if (cached) return JSON.parse(cached);

  if (!storyId) throw CreateError(400, "Require story id");
  if (!storyNodeId) throw CreateError(400, "Require story node id");

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

  const result = map.get(storyNodeId);

  redis.setex(REDIS_KEY, REDIS_TTL, JSON.stringify(result));

  return result;
}

export async function FindAllStoryNodes({ storyId, parentId, sort = { updated_at: "desc" } }, page = 1, limit = 10, isGettingChildren = false) {
  const storiesVer = await redisService.stories(storyId).get();
  const storyNodesVer = await redisService.storyNodes(storyId).get();
  const storyNodesParentVer = await redisService.storyNodes(parentId).get();

  const REDIS_KEY = [
    "FindAllStoryNodes",
    "storiesVer=" + storiesVer,
    "storyNodesParentVer=" + storyNodesParentVer,
    "storyNodesVer=" + storyNodesVer,
    "page=" + page,
    "limit=" + limit,
    "storyId=" + storyId,
    "parentId=" + parentId,
    "sort=" + JSON.stringify(sort),
    "isGettingChildren=" + isGettingChildren,
  ].join(":");

  const cached = await redis.get(REDIS_KEY);
  if (cached) return JSON.parse(cached);

  const where = {
    is_deleted: false,

    ...(storyId && { story: { is_deleted: false, id: storyId } }),
    ...(parentId && { parent: { is_deleted: false, id: parentId } }),
  };

  const [storyNodes, totalItems] = await Promise.all([
    db.storyNode
      .findMany({
        where: where,
        orderBy: [sort, { id: "asc" }],
        take: limit,
        skip: (page - 1) * limit,
      })
      .catch(async (error) => {
        if (storyId) {
          if (!isUUID(storyId)) throw CreateError(400, "'storyId' must be UUID");
          const story = await db.story.findFirst({ where: { is_deleted: false, id: storyId } });
          if (!story) throw CreateError(400, "Story not found");
        }

        if (parentId) {
          if (!isUUID(parentId)) throw CreateError(400, "'parentId' must be UUID");
          const parent = await db.storyNode.findFirst({ where: { is_deleted: false, id: parentId } });
          if (!parent) throw CreateError(400, "Parent not found");
        }

        throw new Error(error);
      }),
    db.storyNode.count({ where: where }).catch(async (error) => {
      if (storyId) {
        if (!isUUID(storyId)) throw CreateError(400, "'storyId' must be UUID");
        const story = await db.story.findFirst({ where: { is_deleted: false, id: storyId } });
        if (!story) throw CreateError(400, "Story not found");
      }

      if (parentId) {
        if (!isUUID(parentId)) throw CreateError(400, "'parentId' must be UUID");
        const parent = await db.storyNode.findFirst({ where: { is_deleted: false, id: parentId } });
        if (!parent) throw CreateError(400, "Parent not found");
      }

      throw new Error(error);
    }),
  ]);

  if (isGettingChildren) {
    for (const node of storyNodes) {
      node.children = await BuildStoryTree(node.story_id, node.id);
    }
  }

  const result = {
    success: true,
    data: storyNodes,
    pagination: {
      page: page,
      pageSize: storyNodes.length,
      totalPages: Math.ceil(totalItems / limit),
      totalItems: totalItems,
    },
  };

  redis.setex(REDIS_KEY, REDIS_TTL, JSON.stringify(result));

  return result;
}

export async function FindStoryNode({ id, storyId, parentId, storyNodeType, orderIndex, isGettingChildren = false, isGettingContent = false }) {
  const storiesVer = await redisService.stories(storyId).get();
  const storyNodeVer = await redisService.storyNodes(storyId).get();

  const REDIS_KEY = [
    "FindStoryNode",
    "storiesVer=" + storiesVer,
    "storyNodeVer=" + storyNodeVer,
    "id=" + id,
    "storyId=" + storyId,
    "parentId=" + parentId,
    "storyNodeType=" + storyNodeType,
    "orderIndex=" + orderIndex,
    "isGettingChildren=" + isGettingChildren,
    "isGettingContent=" + isGettingContent,
  ].join(":");

  const cached = await redis.get(REDIS_KEY);
  if (cached) return JSON.parse(cached);

  if (!(id || (storyId && storyNodeType && orderIndex && parentId))) {
    throw CreateError(400, "Require id or (story id, story node type, story node's parent id and order index)");
  }

  const storyNode = await db.storyNode
    .findFirst({
      where: {
        is_deleted: false,

        ...(id && { id: id }),
        ...(storyId && { story_id: storyId }),
        ...(parentId && { parent_id: parentId }),
        ...(storyNodeType && { type: storyNodeType }),
        ...(orderIndex && { order_index: orderIndex }),
      },

      ...(isGettingContent && {
        include: {
          content: {
            where: { is_deleted: false },
            select: { type: true, image: { where: { is_deleted: false } } },
            orderBy: { order_index: "asc" },
          },
        },
      }),
    })
    .catch(async (error) => {
      if (storyId) {
        if (!isUUID(storyId)) throw CreateError(400, "'storyId' must be UUID");
        const story = await db.story.findFirst({ where: { is_deleted: false, id: storyId } });
        if (!story) throw CreateError(400, "Story not found");
      }

      if (parentId) {
        if (!isUUID(parentId)) throw CreateError(400, "'parentId' must be UUID");
        const parent = await db.storyNode.findFirst({ where: { is_deleted: false, id: parentId } });
        if (!parent) throw CreateError(400, "Parent not found");
      }

      throw new Error(error);
    });

  if (isGettingChildren) {
    storyNode.children = await BuildStoryTree(storyNode.story_id, storyNode.id, isGettingContent);
  }

  const result = { success: true, data: storyNode };

  redis.setex(REDIS_KEY, REDIS_TTL, JSON.stringify(result));

  return result;
}

export async function AddStoryNode(
  storyId,
  parentId,
  data = {
    title,
    type,
    orderIndex,
    posterId,
  },
) {
  if (!storyId) throw CreateError(400, "Require 'storyId'");

  const { title, type, orderIndex, posterId } = data;

  if (!type || !orderIndex) throw CreateError(400, "Story node 'type' and 'orderIndex' are required");

  return await db.$transaction(async (db) => {
    const newStoryNode = await db.storyNode
      .create({
        data: {
          story: { connect: { id: storyId } },
          ...(parentId && { parent: { connect: { id: parentId } } }),
          ...(posterId && { poster: { connect: { id: posterId } } }),
          ...(title && { title: title }),
          type: type,
          order_index: Number(orderIndex),
        },
      })
      .catch(async (error) => {
        const story = await db.story.findUnique({ where: { id: storyId } });
        if (!story) throw CreateError(400, "Story not found");

        if (parentId) {
          const parent = await db.storyNode.findUnique({ where: { id: parentId } });
          if (!parent) throw CreateError(400, "Parent not found");
        }

        throw new Error(error);
      });

    redisService.storyNodes(newStoryNode.story_id).incr();
    redisService.stories(newStoryNode.story_id).incr();
    if (newStoryNode.parent_id) redisService.storyNodes(newStoryNode.parent_id).incr();

    // Update number of children for parent or story
    if (newStoryNode.parent_id) {
      await db.storyNode.update({ where: { id: newStoryNode.parent_id }, data: { number_of_children: { increment: 1 } } });
    } else {
      await db.story.update({ where: { id: storyId }, data: { number_of_children: { increment: 1 } } });
    }
    return { success: true, data: newStoryNode };
  });
}

export async function UpdateStoryNode(
  storyNodeId,
  data = {
    title,
    type,
    orderIndex,
    posterId,
    contents: [{ type, orderIndex, content, image: { url, height, width } }],
  },
) {
  const { title, type, orderIndex, contents } = data;

  const uploadImage =
    contents && contents.length > 0
      ? await db.image.createManyAndReturn({
          data: contents.map((content) => ({ url: content?.image?.url, height: content?.image?.height, width: content?.image?.width })),
        })
      : null;

  let uploadImageIndex = 0;

  const updating = await db.storyNode
    .update({
      where: { id: storyNodeId },
      data: {
        title: title,
        type: type,
        order_index: orderIndex,
        content: {
          createMany: {
            data: contents.map((content) => ({
              order_index: content.orderIndex,
              type: content.type,
              content: content.content,
              ...(content.type === "image" && { image_id: uploadImage[uploadImageIndex++].id }),
            })),
          },
        },
      },
    })
    .catch(async (error) => {
      const storyNode = await db.storyNode.findUnique({ where: { id: storyNodeId } });
      if (!storyNode) throw CreateError(400, "Story node not found");

      throw new Error(error);
    });

  redisService.storyNodes(updating.story_id).incr();
  redisService.stories(updating.story_id).incr();
  if (updating.parent_id) redisService.storyNodes(updating.parent_id).incr();

  return { success: true, data: updating };
}

export async function SoftDeleteStoryNode(storyNodeId) {
  if (!storyNodeId) throw CreateError(400, "Require 'storyNodeId'");

  const storyNode = await db.storyNode
    .update({
      where: { id: storyNodeId },
      data: { is_deleted: true },
    })
    .catch(async (error) => {
      const storyNode = await db.storyNode.findUnique({ where: { id: storyNodeId } });
      if (!storyNode) throw CreateError(400, "Story node not found");

      throw new Error(error);
    });

  redisService.storyNodes(storyNode.story_id).incr();
  redisService.stories(storyNode.story_id).incr();
  if (storyNode.parent_id) redisService.storyNodes(storyNode.parent_id).incr();

  return { success: true, message: "Remove successfully" };
}

export async function HardDeleteStoryNode(storyNodeId) {
  if (!storyNodeId) throw CreateError(400, "Require 'storyNodeId'");

  const storyNode = await db.storyNode
    .delete({
      where: { id: storyNodeId },
    })
    .catch(async (error) => {
      const storyNode = await db.storyNode.findUnique({ where: { id: storyNodeId } });
      if (!storyNode) throw CreateError(400, "Story node not found");

      throw new Error(error);
    });

  redisService.storyNodes(storyNode.story_id).incr();
  redisService.stories(storyNode.story_id).incr();
  if (storyNode.parent_id) redisService.storyNodes(storyNode.parent_id).incr();

  return { success: true, message: "Remove successfully" };
}

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
