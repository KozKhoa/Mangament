import chokidar from "chokidar";
import path from "path";

import {
  AddImage,
  UpdateImage,
  SoftDeleteImage,
  FindImage,
} from "./Image.Model.js";

import { AddStory, UpdateStory, FindStory } from "./Story.Model.js";
import {
  FindStoryNode,
  UpdateStoryNode,
  AddStoryNode,
} from "./StoryNode.Model.js";

import DIRECTORY from "../constants/Directory.js";

const root = path.resolve("../../uploads/story"); // ""

const HandleAdding = async (filePath) => {
  const node = filePath.split(path.sep);

  const type = node[0];
  const storyName = node[1];

  const story = await AddStory({ title: storyName, type: type });
  if (story.success === true) {
    console.log(`✅ [Upload.Model.js] Story ${storyName} added`);
  }
  const storyId = story.data.id;

  let parentId = null;
  for (let i = 2; i < node.length - 1; i++) {
    // Add story node
    let storyNodeName = node[i].split(" "); // story name could be Chapter 12, Chapter 12.5, etc
    let storyNodeType = storyNodeName[0].toLowerCase();
    let storyNodeIndex = storyNodeName[1];

    let isStoryNodeExist = await FindStoryNode({
      story_id: storyId,
      parent_id: parentId,
      order_index: Number(storyNodeIndex),
    });

    if (!isStoryNodeExist.data) {
      let storyNode = await AddStoryNode({
        title: "",
        type: storyNodeType,
        story_id: storyId,
        parent_id: parentId,
        order_index: Number(storyNodeIndex) || 0,
      });

      if (storyNode.success === true) {
        console.log(
          `✅ [Upload.Model.js] StoryNode ${storyNodeType} ${storyNodeIndex} added`
        );
      }
      parentId = storyNode.data.id;
    }
  }

  let contentName = node[node.length - 1];
  let contentType = path.extname(contentName).toLowerCase().replace(".", "");
  if (contentType === "png" || contentType === "jpg") {
    const image = await AddImage({
      url: `${DIRECTORY.UPLOADS_STORY}/${filePath}`,
    });
    const imageId = image?.data?.id || null;

    // Update cover art for story
    const fileName = node[node.length - 1].split(".")[0];
    if (fileName === "cover_art" && imageId) {
      const coverArt = await UpdateStory(
        { id: storyId },
        { cover_art: { connect: { id: image?.data?.id || null } } }
      );
      if (coverArt && coverArt.success) {
        console.log(`✅ [Upload.Model.js] Cover art for ${storyName} added`);
      }
    } else if (imageId) {
      // Add image id to story node
      const storyNode = await FindStoryNode({ id: parentId }, false, true);
      const oldStoryNodeContent = storyNode?.data?.content || [];

      const newStoryNodeContent = [
        ...oldStoryNodeContent,
        {
          type: "iamge",
          image_url: image.data.url,
        },
      ];
      console.log("✅ [Upload.Model.js] Image added: ", filePath);

      await UpdateStoryNode(
        { id: storyNode?.data?.id },
        // Update parent's number of children
        {
          content: newStoryNodeContent,
        }
      );
    }
  }
};

const addingQueue = [];
let isProccessingAdding = false;
const ProccessAddingQueue = async () => {
  if (isProccessingAdding) return;
  isProccessingAdding = true;

  while (addingQueue.length > 0) {
    const dir = addingQueue.shift();
    try {
      await HandleAdding(dir);
    } catch (error) {
      console.error("❌ [Upload.Model.js] Error update change: ", error);
    }
  }
  isProccessingAdding = false;
};

const TrackingFoler = (filePath) => {
  const watch = chokidar.watch(filePath, {
    ignored: /(^|[\/\\])\../, // ignore file và folder ẩn bắt đầu bằng .
    persistent: true,
  });

  watch.on("add", async (filePath) => {
    const dir = path.relative(root, filePath);
    addingQueue.push(dir);
    await ProccessAddingQueue();
  });
  // watch.on("unlink", async (filePath) => {
  //   const dir = path.relative(root, filePath);
  // });
};

export const UploadManga = () => {
  TrackingFoler(root + "/manga");
};

UploadManga();
