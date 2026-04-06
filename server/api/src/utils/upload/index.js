import chokidar from "chokidar";
import path from "path";
import { PrismaClient } from "../../generated/prisma/client.js";

import fs from "fs";

import { getAllFiles } from "../FileHandle.js";

const ADMIN_TOKEN =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6IjFhYzU5ZGQ1LWMxMzUtNDJiMi05NDlmLWE1OTI3OWU4ZjMwMCIsIm5hbWUiOiJLaG9hIiwiZW1haWwiOiJhQGEuYSIsInJvbGUiOiJhZG1pbiIsImlhdCI6MTc3NTA2MDQxNiwiZXhwIjoxNzc3NjUyNDE2fQ.n_9Bwr461FyEhNIzsX5axDCnB7H9jStsBDwOeUndJP8";

const db = new PrismaClient();

// const root = "/home/khoa/Code/Project/Mangament/uploads/story";
const root = path.resolve("../../../../../uploads/story");

const alreadyAddStories = new Map();
const alreadyAddStoryNodes = new Map();
const alreadyCheckFolder = new Set();

const watch = chokidar.watch(root, {
  ignored: /(^|[\/\\])\../, // ignore file và folder ẩn bắt đầu bằng .
  persistent: true,
});

async function handleAdd(filePath) {
  // dir = manga/Genshin Impact/chapter 10/001.png
  const dir = path.relative(root, filePath);

  const seperateDir = dir.split(path.sep);

  const storyType = seperateDir[0].toLowerCase();
  const storyName = seperateDir[1];
  const imageName = seperateDir[seperateDir.length - 1];
  const storyNodeNames = seperateDir.slice(2, -1);

  const folderPath = filePath.split(path.sep).slice(0, -1).join(path.sep);

  if (alreadyCheckFolder.has(folderPath)) {
    return;
  }

  // Add story
  const story = await handleAddStory({
    storyName: storyName,
    storyType: storyType,
  });

  // Update cover art for story and terminate this
  if (path.parse(dir).name === "cover_art") {
    const coverArtFormData = new FormData();
    coverArtFormData.append("image", new Blob([fs.readFileSync(filePath)]), imageName);

    const coverArtRes = await fetch(`http://localhost:5000/uploads/story/${story.id}/cover-art`, {
      headers: {
        Authorization: `Bearer ${ADMIN_TOKEN}`,
        "x-api-key": process.env.API_KEY,
      },
      method: "POST",
      body: coverArtFormData,
    });

    const coverArtResJson = await coverArtRes.json();

    const { url: coverArtUrl, key: coverArtKey, id: coverArtId } = coverArtResJson.data;

    // Update cover art for story
    await db.story.update({
      where: { id: story.id },
      data: { cover_art: { connect: { url: coverArtUrl } } },
    });

    // const covertArtKey = ["story", dir].join("/");

    // const iamge = await db.image.create({ data: { url: ["http://localhost:5000", covertArtKey].join("/"), key: covertArtKey } });

    // Update cover art for story
    // await db.story.update({
    //   where: { id: story.id },
    //   data: { cover_art: { connect: { id: iamge.id } } },
    // });

    console.log("Add cover art for " + storyName);
    return;
  }

  // Add story node
  let parentId = null;
  for (const name of storyNodeNames) {
    const storyNode = await handleAddStoryNode({
      storyNodeName: name,
      storyId: story.id,
      parentId: parentId,
    });

    parentId = storyNode.id;
  }
  const storyNodeId = parentId;

  const files = await getAllFiles(folderPath);

  const uploadPromises = files.map((file) => {
    const imageFormData = new FormData();
    imageFormData.append("image", new Blob([fs.readFileSync(file)]));
    return fetch(`http://localhost:5000/uploads/story/${story.id}/story-node/${storyNodeId}/content`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${ADMIN_TOKEN}`,
        "x-api-key": process.env.API_KEY,
      },
      body: imageFormData,
    });
  });

  const uploadImages = await Promise.all(uploadPromises);

  const uploadJson = await Promise.all(uploadImages.map((upload) => upload.json()));

  console.log(uploadJson);

  const addContent = await db.storyNodeContent.createMany({
    data: uploadJson.map((image, i) => ({ story_node_id: storyNodeId, image_id: image.data.id, type: "image", order_index: i })),
  });

  // const imageIds = [];

  // for (const file of files) {
  //   const imageKey = ["story", file.replace(root, "")].join("/");
  //   const image = await db.image.create({ data: { url: ["http://localhost:5000", imageKey].join("/"), key: imageKey } });
  //   imageIds.push(image.id);
  // }

  // await db.storyNodeContent.createMany({
  //   data: imageIds.map((image, i) => ({
  //     story_node_id: storyNodeId,
  //     image_id: image,
  //     type: "image",
  //     order_index: i,
  //   })),
  // });

  console.log("Update content for " + [storyName, ...storyNodeNames].join("/"));

  alreadyCheckFolder.add(folderPath);
}

const addingQueue = [];
let isProccessingAdding = false;
const ProccessAddingQueue = async () => {
  if (isProccessingAdding) return;
  isProccessingAdding = true;

  while (addingQueue.length > 0) {
    const dir = addingQueue.shift();
    try {
      await handleAdd(dir);
    } catch (error) {
      console.error("❌ Error update change: ", error);
    }
  }
  isProccessingAdding = false;
};

watch.on("add", async (filePath) => {
  addingQueue.push(filePath);
  await ProccessAddingQueue();
});

const handleAddStory = async ({ storyName = "", storyType = "", covertArtId = "" }) => {
  // Kiểm tra sự tồn tại của story
  const alreadyAddStory = alreadyAddStories.get(storyName + storyType);

  if (alreadyAddStory) {
    return alreadyAddStory;
  }

  let story = await db.story.findFirst({
    where: { title: storyName, type: storyType },
  });

  // Nếu không tìm thấy
  if (!story) {
    story = await db.story.create({
      data: {
        title: storyName,
        type: storyType,
        ...(covertArtId && {
          cover_art: {
            connect: {
              id: covertArtId,
            },
          },
        }),
      },
    });
    console.log("Added story ", storyName);
  }

  alreadyAddStories.set(storyName + storyType, story);

  return story;
};

const handleAddStoryNode = async ({ storyNodeName = "", storyId, parentId }) => {
  const alreadyAddStoryNode = alreadyAddStoryNodes.get(storyNodeName + storyId + parentId);

  if (alreadyAddStoryNode) return alreadyAddStoryNode;

  const seperateStoryNodeName = storyNodeName.split(" ");
  const storyNodeType = seperateStoryNodeName[0].toLowerCase();
  const storyNodeIndex = Number(seperateStoryNodeName[1]);

  let storyNode;
  // Kiểm tra sự tồn tại của story node
  storyNode = await db.storyNode.findFirst({
    where: {
      story_id: storyId,
      ...(parentId && { parent_id: parentId }),
      type: storyNodeType,
      order_index: storyNodeIndex,
    },
  });

  if (!storyNode) {
    storyNode = await db.storyNode.create({
      data: {
        story: {
          connect: { id: storyId },
        },
        ...(parentId && {
          parent: {
            connect: {
              id: parentId,
            },
          },
        }),
        order_index: storyNodeIndex,
        type: storyNodeType,
      },
    });
    console.log("Added story node", storyNodeName);

    // Tăng số lượng con của story hoặc parent
    if (storyId && !parentId) {
      await db.story.update({
        where: { id: storyId },
        data: {
          number_of_children: {
            increment: 1,
          },
        },
      });
    } else if (storyId && parentId) {
      // Tăng số con của parent
      await db.storyNode.update({
        where: { id: parentId, story_id: storyId },
        data: {
          number_of_children: {
            increment: 1,
          },
        },
      });
    }
  }

  alreadyAddStoryNodes.set(storyNodeName + storyId + parentId, storyNode);

  return storyNode;
};

const handleAddImage = async ({ imageUrl = "" }) => {
  // Kiểm tra sự tồn tại của url
  const isExist = await db.image.findFirst({ where: { url: imageUrl } });
  if (isExist) return isExist;

  const image = await db.image.create({ data: { url: imageUrl } });
  console.log("Added image ", imageUrl);

  return image;
};

const handleAddContentForStoryNode = async ({ storyNodeId = "", imageId }) => {
  const update = await db.storyNodeContent.createMany;

  // // Không cần kiểm tra sự tồn tại của storyNodeId vi chắc chắn nó tồn tại
  // const storyNode = await db.storyNode.findFirst({
  //   where: { id: storyNodeId },
  // });
  // if (!storyNode) {
  //   setTimeout(() => {
  //     // Sleep
  //     console.log("Can not find story node id = ", storyNodeId, ". Retry in 5s");
  //   }, 5000);
  //   return handleAddContentForStoryNode({
  //     storyNodeId: storyNodeId,
  //     content: content,
  //   });
  // }
  // const oldContent = storyNode.content || [];
  // const newContent = oldContent;
  // newContent.push(content);
  // const updateStoryNode = await db.storyNode.update({
  //   where: {
  //     id: storyNodeId,
  //   },
  //   data: {
  //     content: newContent,
  //   },
  // });
  // return updateStoryNode;
};

const handleAddCoverArtForStory = async ({
  storyId = "",
  coverArtId = "", // This id is from image that has already all before
}) => {
  const story = await db.story.update({
    where: { id: storyId },
    data: {
      cover_art: {
        connect: {
          id: coverArtId,
        },
      },
    },
  });

  return story;
};
