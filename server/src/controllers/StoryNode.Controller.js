import path from "path";
import fs from "fs";

import { CreateError } from "../utils/ErrorHandle.js";
import ErrorCodes from "../constants/Error.js";
import {
  AddStoryNode,
  FindAllStoryNodes,
  FindStoryNode,
  UpdateStoryNode,
  GetParentStoryNodeTree,
  SoftDeleteStoryNode,
  IncreaseOneViewForStoryNodeAndItsParents,
} from "../models/StoryNode.Model.js";
import { FindStory } from "../models/Story.Model.js";
import { AddImage, FindImage, HardDeleteImage, SoftDeleteImage, UpdateImage } from "../models/Image.Model.js";

import DIRECTORY from "../constants/Directory.js";
import { CreateNewFolder, IsFileExist, MoveFile, SoftRemoveFile, SoftRemoveThingsInFolder } from "../utils/FileHandle.js";
import { IsJsonString } from "../utils/Validators.js";

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

// POST /story-nodes
export async function PostStoryNode(req, res, next) {
  try {
    const userId = req.user.id;

    const { storyId, parentId, title, type, orderIndex } = req.body;

    if (!storyId || !type || !orderIndex) throw CreateError(400, "Require 'storyId', 'type' and 'orderIndex'");

    const storyNode = await AddStoryNode(storyId, parentId, { title: title, type: type, orderIndex: Number(orderIndex), posterId: userId });

    if (!storyNode) throw CreateError();

    return res.status(200).json({
      success: true,
      message: "Add story node successfully",
      data: storyNode.data,
    });
  } catch (error) {
    next(error);
  }
}

export async function PutStoryNode(req, res, next) {
  try {
    const userId = req.user.id;
    const storyNodeId = req.params?.id;
    if (!storyNodeId) throw CreateError(400, "'id' is required");

    const { storyId, parentId, title, type, orderIndex, view } = req?.body;

    if (!storyId) throw CreateError(400, "Missing required fields");
    // Updating
    const updating = await UpdateStoryNode(
      { id: storyNodeId },
      {
        ...(storyId && { story: { connect: { id: storyId } } }),
        ...(parentId && { parent: { connect: { id: parentId } } }),
        ...(title && { title: title }),
        ...(type && { type: type }),
        ...(orderIndex && { order_index: Number(orderIndex) }),
        ...(view && { view: Number(view) }),
        updated_at: new Date(),
      },
    );

    return res.status(200).json({
      success: true,
      message: "Update story node successfully",
      data: updating.data,
    });
  } catch (error) {
    next(error);
  }
}

export async function PatchStoryNodeContent(req, res, next) {
  try {
    const storyNodeId = req.params?.id;

    // Validate input value
    if (!storyNodeId) throw CreateError(400, "'id' is required");
    if (!req.body?.content) throw CreateError(400, "Missing required fields");
    if (!IsJsonString(req.body.content)) {
      throw CreateError(400, "Invalid content");
    }

    // Get image
    const images = [];
    if (req.files && req.body?.content) {
      // Get story
      const story = await FindStory({ id: storyNode.data.story_id });
      if (!story || !story.success || !story.data) throw CreateError(404, "Story not found");

      // Get tree structure for the whole story node parents
      const storyNodeTree = await GetParentStoryNodeTree(story.id, storyNode.data.parent_id);

      // Generate directory for image
      let newFolderPath = "";
      function updateFolderName(parent) {
        if (!parent) return;
        const parentFolderPath = parent.type + " " + parent.order_index;
        newFolderPath = path.join(parentFolderPath, newFolderPath);
        updateFolderName(parent.parent);
      }
      updateFolderName(storyNodeTree);
      newFolderPath = path.join(
        DIRECTORY.UPLOADS_STORY,
        story?.data?.type || "",
        story?.data?.title || "",
        newFolderPath,
        `${storyNode.data.type} ${storyNode.data.order_index}`,
      );
      await CreateNewFolder(newFolderPath);

      let i = 0;
      for (const file of req.files) {
        const newFileName = `0${i++}_${new Date()}` + path.extname(file.filename);
        const newFilePath = `${newFolderPath}/${newFileName}`;

        // Move file to where its should be
        MoveFile(file.path, newFilePath); // This is async method

        // Add new image url to db
        const newImage = await AddImage({ url: newFilePath });
        images.push(newImage.data.url);
      }
    }

    // Update content
    const content = await JSON.parse(req.body.content);
    content.forEach((element) => {
      if (element.type === "image" && images) {
        element.iamge_url = images[Number(element.image_index)];

        delete element.image_index;
      }
    });

    // Save content to story node
    const updateContent = await UpdateStoryNode({ id: storyNodeId }, { content: content });

    return res.status(200).json({
      success: true,
      message: "Update story node content successfully",
      data: { story_node_id: storyNodeId, content: content },
    });
  } catch (error) {
    next(error);
  }
}

export async function DeleteStoryNode(req, res, next) {
  try {
    const storyNodeId = req.params?.id;
    if (!storyNodeId) throw CreateError(400, "'id' is required");

    const storyNode = await FindStoryNode({ id: storyNodeId });
    if (!storyNode || !storyNode.success || !storyNode.data) throw CreateError(404, "Story node not found");

    const removing = await SoftDeleteStoryNode({ id: storyNodeId });
    if (!removing || !removing.success) throw CreateError();

    return res.status(200).json({
      success: true,
      message: "Delete story node successfully",
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
