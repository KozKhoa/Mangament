import cloudinary from "../configs/cloudinary.js";
import { CreateError } from "../utils/ErrorHandle.js";

import * as storiesModel from "../models/Story.Model.js";
import * as storyNodesModel from "../models/StoryNode.Model.js";
import db from "../configs/db.js";

export async function uploadImage(filePath) {
  const result = await cloudinary.uploader.upload(filePath, {
    image_metadata: true,
    folder: "Mangement",
  });

  return result;
}

export async function generateSignatureForUploadStoryCoverArt(storyId, storyType, storyTitle) {
  if (!storyId && !(storyType && storyTitle)) throw CreateError(400, "Require 'storyId' or 'storyType' and 'storyTitle' to generate signature");

  let story = { title: storyTitle, type: storyType };
  if (!storyTitle || !storyType) {
    story = (await storiesModel.FindStory({ id: storyId })).data;
    if (!story) throw CreateError(400, "Story not found");
  }

  const timestamp = Math.round(new Date().getTime() / 1000);

  const folder = ["Mangament", story.type, story.title].join("/");
  const publicId = ["stories", story.type, story.title, "cover_art"].join("/");

  const signature = cloudinary.utils.api_sign_request({ timestamp, folder, public_id: publicId }, process.env.CLOUDINARY_API_SECRET);

  return { timestamp, signature, folder, publicId };
}

export async function generateSignatureForUploadStoryNodeContent(storyNodeId) {
  if (!storyNodeId) throw CreateError(400, "Require 'storyNodeId' to generate signature");

  const timestamp = Math.round(new Date().getTime() / 1000);

  const storyNode = await db.storyNode.findUnique({ where: { id: storyNodeId }, include: { story: true } });
  if (!storyNodeId) throw CreateError(400, "Story node not found");

  const story = storyNode.story;
  if (!story) throw CreateError(400, "Story not found");

  let folder = ["Mangament", story.type, story.title].join("/");
  // let publicId = ["stories", story.type, story.title].join("/");

  if (storyNode.parent_id) {
    let tree = await storyNodesModel.GetParentStoryNodeTree(story.id, storyNode.parent_id, false);

    let parentNodes = [];
    while (tree) {
      parentNodes.push(tree);
      tree = tree?.children;
    }

    folder = [folder, parentNodes.map((node) => [node.type, node.order_index].join(" "))].join("/");
    // publicId = [publicId, parentNodes.map((node) => [node.type, node.order_index].join(" "))].join("/");
  }

  folder = [folder, storyNode.type + " " + storyNode.order_index].join("/");
  // publicId = [publicId, storyNode.type + " " + storyNode.order_index].join("/");

  const signature = cloudinary.utils.api_sign_request({ timestamp, folder }, process.env.CLOUDINARY_API_SECRET);

  return { timestamp, signature, folder };
}
