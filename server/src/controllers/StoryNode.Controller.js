import path from "path";
import fs from "fs";

import { CreateError } from "../utils/ErrorHandle.js";
import ErrorCodes from "../constants/Error.js";
import {
  AddStoryNode,
  FindAllStoryNodes,
  FindStoryNode,
  UpdateStoryNode,
  ValidateStoryNodeType,
  GetParentStoryNodeTree,
  SoftDeleteStoryNode,
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

    if (!storyNodeId) throw CreateError(ErrorCodes.BAD_REQUEST);

    const storyNode = await FindStoryNode({ id: storyNodeId, isGettingChildren: isGettingChildren });

    if (!storyNode || !storyNode.success || !storyNode.data) throw CreateError(ErrorCodes.STORY_NODE_NOT_FOUND);

    if (!isGettingContent) delete storyNode.data.content;

    return res.status(200).json({
      success: true,
      message: "Get story node successfully",
      data: storyNode.data,
    });
  } catch (error) {
    next(error);
  }
}

export async function PostStoryNode(req, res, next) {
  try {
    const userId = req.user.id;
    const { storyId, parentId, title, type, orderIndex, numberOfChildren } = req.body;

    if (!storyId || !type || !orderIndex) throw CreateError(ErrorCodes.MISSING_FIELD);

    // Validate type of story node
    if (!ValidateStoryNodeType(type)) throw CreateError(ErrorCodes.INVALID_INPUT);

    // Make sure story exist
    const story = await FindStory({ id: storyId });
    if (!story || !story.success || !story.data) throw CreateError(ErrorCodes.STORY_NOT_FOUND);

    const storyNode = await AddStoryNode({
      title: title || "",
      type: type,
      story_id: storyId,
      ...(parentId && { parent_id: parentId }),
      order_index: Number(orderIndex),
      poster_id: userId,
      ...(numberOfChildren && { number_of_children: Number(numberOfChildren) }),
    });

    if (!storyNode) throw CreateError(ErrorCodes.INTERNAL_SERVER_ERROR);
    if (!storyNode.success && storyNode.data) throw CreateError(ErrorCodes.ASSET_ALREADY_EXIST);

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
    if (!storyNodeId) throw CreateError(ErrorCodes.BAD_REQUEST);

    const { storyId, parentId, title, type, orderIndex, view } = req?.body;
    if (!ValidateStoryNodeType(type)) throw CreateError(ErrorCodes.INVALID_INPUT);
    if (!storyId) throw CreateError(ErrorCodes.MISSING_FIELD);

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
      }
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
    if (!storyNodeId) throw CreateError(ErrorCodes.BAD_REQUEST);
    if (!req.body?.content) throw CreateError(ErrorCodes.MISSING_FIELD);
    if (!IsJsonString(req.body.content)) {
      throw CreateError(ErrorCodes.INVALID_INPUT);
    }

    // Get image
    const images = [];
    if (req.files && req.body?.content) {
      // Get story
      const story = await FindStory({ id: storyNode.data.story_id });
      if (!story || !story.success || !story.data) throw CreateError(ErrorCodes.STORY_NOT_FOUND);

      // Get tree structure for the whole story node parents
      const storyNodeTree = await GetParentStoryNodeTree(storyNode.data.parent_id);

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
        `${storyNode.data.type} ${storyNode.data.order_index}`
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
    if (!storyNodeId) throw CreateError(ErrorCodes.BAD_REQUEST);

    const storyNode = await FindStoryNode({ id: storyNodeId });
    if (!storyNode || !storyNode.success || !storyNode.data) throw CreateError(ErrorCodes.STORY_NODE_NOT_FOUND);

    const removing = await SoftDeleteStoryNode({ id: storyNodeId });
    if (!removing || !removing.success) throw CreateError(ErrorCodes.INTERNAL_SERVER_ERROR);

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
    if (!storyNodeId) throw CreateError(ErrorCodes.BAD_REQUEST);

    const storyNode = await FindStoryNode({ id: storyNodeId });
    if (!storyNode || !storyNode.success || !storyNode.data) throw CreateError(ErrorCodes.STORY_NODE_NOT_FOUND);

    const updating = await UpdateStoryNode({ id: storyNodeId }, { view: { increment: 1 } });
    if (!updating || !updating.success) throw CreateError(ErrorCodes.INTERNAL_SERVER_ERROR);

    return res.status(200).json({
      success: true,
      message: "Increase one view for story node successfully",
      story_node: {
        id: storyNode.data.id,
        view: storyNode.data.view + 1,
      },
    });
  } catch (error) {
    next(error);
  }
}
