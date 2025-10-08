import chokidar from "chokidar";
import path from "path";

import {
  AddImage,
  UpdateImage,
  SoftDeleteImage,
  FindImage,
} from "./Image.Model.js";

import {
  AddStory,
  UpdateStory,
  AddStoryNode,
  UpdateStoryNode,
  FindStory,
  FindStoryNode,
} from "./Story.Model.js";
import { uptime } from "process";

const root = path.resolve("../../uploads");

const HandleAdding = async (filePath) => {
  const node = filePath.split(path.sep);

  const type = node[0];
  const storyName = node[1];

  const story = await AddStory({ title: storyName, type: type });
  const storyId = story.data.id;

  let parentId = null;
  for (let i = 2; i < node.length - 1; i++) {
    // Add story node
    let storyNodeName = node[i].split(" "); // story name could be Chapter 12, etc
    let storyNodeType = storyNodeName[0].toLowerCase();
    let storyNodeIndex = storyNodeName[1];

    let storyNode = await AddStoryNode({
      title: "",
      type: storyNodeType,
      story_id: storyId,
      parent_id: parentId,
      order_index: Number(storyNodeIndex) || 0,
    });

    parentId = storyNode.data.id;
  }

  let contentName = node[node.length - 1];
  let contentType = path.extname(contentName).toLowerCase().replace(".", "");

  if (contentType === "png" || contentType === "jpg") {
    const image = await AddImage({ url: filePath });
    const imageId = image?.data?.id || null;
    if (imageId) {
      // Add image id to story node
      const storyNode = await FindStoryNode({ id: parentId });
      const oldStoryNodeContent = storyNode?.data?.content || [];

      const newStoryNodeContent = [
        ...oldStoryNodeContent,
        {
          type: "iamge",
          image_id: imageId,
        },
      ];

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
      console.log(`${dir} is added`);
    } catch (error) {
      console.error("❌ [Upload.Model.js] Error update change: ", error);
    }
  }
  isProccessingAdding = false;
};

const HandleRemove = async (filePath) => {
  const node = filePath.split(path.sep);

  const type = node[0];
  const storyName = node[1];
};

const removeQueue = [];
let isProccessingRemoving = false;
const ProccessRemovingQueue = async () => {
  if (isProccessingRemoving) return;
  isProccessingRemoving = true;
};

const TrackingFoler = (filePath) => {
  const watch = chokidar.watch(filePath, {
    persistent: true,
  });

  watch.on("add", async (filePath) => {
    const dir = path.relative(root, filePath);
    addingQueue.push(dir);
    ProccessAddingQueue();
  });
  // watch.on("unlink", async (filePath) => {
  //   const dir = path.relative(root, filePath);
  // });
};

export const UploadManga = () => {
  TrackingFoler(root + "/manga");
};

UploadManga();
