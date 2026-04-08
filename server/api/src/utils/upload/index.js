import chokidar from "chokidar";
import path from "path";
import pg from "pg";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../../generated/prisma/client.js";
// import db from "../../configs/db.js";

// const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL });
// const adapter = new PrismaPg(pool);

// const db = new PrismaClient({
//   adapter: adapter,
// });

import db from "../../configs/db.js";

import fs from "fs";

import { getAllFiles } from "../FileHandle.js";

const ADMIN_TOKEN =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6IjFhYzU5ZGQ1LWMxMzUtNDJiMi05NDlmLWE1OTI3OWU4ZjMwMCIsIm5hbWUiOiJLaG9hIiwiZW1haWwiOiJhQGEuYSIsInJvbGUiOiJhZG1pbiIsImlhdCI6MTc3NTU2NzgwMCwiZXhwIjoxNzc4MTU5ODAwfQ.UIzsPf-bIN9w5v7fpMJH15XU1kqfFTeU5try_t1Uh3s";

const root = "/home/khoa/OneDrive/Code/Project/Mangament/uploads/story";
// const root = path.resolve("../../../../../uploads/story");

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

  console.log(dir);

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

  const addContent = await db.storyNodeContent.createMany({
    data: uploadJson.map((image, i) => ({ story_node_id: storyNodeId, image_id: image.data.id, type: "image", order_index: i })),
  });

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

  console.log(storyId, parentId, storyNodeType, storyNodeIndex);

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
    // storyNode = await db.storyNode.create({ data: { type: storyNodeType, order_index: storyNodeIndex, story_id: storyId }, select: { id: true } });
    const id = crypto.randomUUID();
    storyNode = await db.$queryRaw`INSERT INTO "StoryNode" ( "id", "story_id", "order_index", "type")
      VALUES (${id}::uuid, ${storyId}::uuid, ${storyNodeIndex}, ${storyNodeType}::"StoryNodeType")
      RETURNING *;
      `;

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

export default function initUpload() {
  console.log("Watching folder: " + root);

  watch.on("add", async (filePath) => {
    addingQueue.push(filePath);
    await ProccessAddingQueue();
  });
}
