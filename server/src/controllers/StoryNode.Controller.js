import { CreateError } from "../utils/ErrorHandle.js";

import { FindStoryNode, IncreaseOneViewForStoryNodeAndItsParents } from "../models/StoryNode.Model.js";

export async function GetStoryNode(req, res, next) {
  try {
    const storyNodeId = req.params?.id;
    const isGettingChildren = req.query?.isGettingChildren == "true" ? true : false;
    const isGettingContent = req.query?.isGettingContent == "true" ? true : false;

    if (!storyNodeId && !(storyId && storyNodeType && orderIndex)) throw CreateError(400, "'id' is required");

    const storyNode = await FindStoryNode({
      id: storyNodeId,
      isGettingChildren: isGettingChildren,
      isGettingContent: isGettingContent,
    });

    if (!storyNode) throw CreateError();

    return res.status(200).json({
      success: true,
      message: "Get story node successfully",
      data: storyNode.data,
    });
  } catch (error) {
    next(error);
  }
}

export async function IncreaseOneViewForStoryNode(req, res, next) {
  try {
    const storyNodeId = req.params?.id;
    if (!storyNodeId) throw CreateError(400, "'id' is required");

    const updating = await IncreaseOneViewForStoryNodeAndItsParents(storyNodeId);
    if (!updating) throw CreateError();

    return res.status(200).json({
      success: true,
      message: "Increase one view for story node successfully",
    });
  } catch (error) {
    next(error);
  }
}
