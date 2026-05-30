import { CreateError } from "../../utils/ErrorHandle.js";

import * as storyNodeService from "../../services/story-node.service.js";

// DELETE /admin/story-nodes/trash/:id
// This is use to permanently remove story node
export async function deletePermanentlyTrashStoryNode(req, res, next) {
  try {
    const storyNodeId = req.params?.id;

    if (!storyNodeId) throw CreateError(400, "'id' for story node is required");

    await storyNodeService.PermanentlyDeleteStoryNodeTrash(storyNodeId);

    return res.json({ success: true, message: "Remove successfully" });
  } catch (error) {
    next(error);
  }
}

// DELETE /admin/story-nodes/trash
// This is use to permanently remove many story nodes
export async function deletePermanentlyManyTrashStoryNodes(req, res, next) {
  try {
    const storyNodeIds = req.body?.ids;

    if (!storyNodeIds || storyNodeIds.length === 0) throw CreateError(400, "Ids are required");

    await storyNodeService.PermanentlyDeleteManyStoryNodesTrash(storyNodeIds);

    return res.json({ success: true, message: "Remove successfully" });
  } catch (error) {
    next(error);
  }
}

//PATCH /admin/story-nodes/trash/:id/restore
// This is use to restore story node
export async function restoreTrashStoryNode(req, res, next) {
  try {
    const storyNodeId = req.params?.id;

    if (!storyNodeId) throw CreateError(400, "'id' for story node is required");

    await storyNodeService.ToggleSoftDeleteStoryNode(storyNodeId, "not_deleted");

    return res.json({ success: true, message: "Restore successfully" });
  } catch (error) {
    next(error);
  }
}

// PATCH /admin/story-nodes/trash/restore
export async function restoreManyTrashStoryNodes(req, res, next) {
  try {
    const storyNodeIds = req.body?.ids;

    if (!storyNodeIds) throw CreateError(400, "'id' for story node is required");

    await storyNodeService.ToggleSoftDeleteManyStoryNodes(storyNodeIds, "not_deleted");

    return res.json({ success: true, message: "Restore successfully" });
  } catch (error) {
    next(error);
  }
}

// GET /admin/story-nodes/trash
export async function getAllStoryNodesTrash(req, res, next) {
  try {
    const page = Number(req.query?.page ?? 1);
    const limit = Number(req.query?.limit ?? 10);
    const storyId = req.query?.storyId;
    const parentId = req.query?.parentId;

    const result = await storyNodeService.FindAllStoryNodesTrash({ storyId, parentId, page, limit });

    if (!result.success) throw CreateError();

    return res.json({ success: true, message: "Get story nodes trash successfully", data: result.data || [], pagination: result.pagination });
  } catch (error) {
    next(error);
  }
}
