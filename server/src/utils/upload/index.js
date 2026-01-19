import path, { parse, sep } from "path";

import db from "../../configs/db.js";

import { isFolder, listAllFiles } from "../../services/google-drive.service.js";

const allFiles = await listAllFiles();

const map = new Map();

for (const file of allFiles) {
  map.set(file.id, file);
}

function buildPath(fileId) {
  let id = fileId;
  let dir = "";

  do {
    const file = map.get(id);
    if (!file) continue;

    dir = file.name + path.sep + dir;

    id = file.parents && file.parents.length > 0 ? file.parents[0] : "";
  } while (id !== "");

  return dir;
}

function buildShareLink(fileId) {
  const imgUrl = `https://drive.google.com/uc?id=${fileId}&export=view`;
  return imgUrl;
}

function buidlTree() {
  const tree = {};
  for (const file of allFiles) {
    if (isFolder(file)) continue;

    const dir = buildPath(file.id);

    // story/manga/Nisekoi/chapter 1/001.png
    const seperateDir = dir.split(path.sep);

    function setDeep(obj, path, value) {
      let cur = obj;
      for (let i = 0; i < path.length - 1; i++) {
        const key = path[i];
        if (typeof cur[key] !== "object" || cur[key] === null) {
          cur[key] = {};
        }
        cur = cur[key];
      }
      cur[path[path.length - 1]] = value;
    }

    const deep = seperateDir.map((dir) => dir);

    setDeep(tree, deep, seperateDir.at(-1));
  }

  return tree;
}

const storyNodeContent = new Map();

function setDeep(obj, path, value) {
  let cur = obj;
  for (let i = 0; i < path.length - 1; i++) {
    const key = path[i];
    if (typeof cur[key] !== "object" || cur[key] === null) {
      cur[key] = {};
    }
    cur = cur[key];
  }
  cur[path[path.length - 1]] = value;
}

const alreadyAdd = {};

async function handleAdd(filePath, fileId) {
  const shareLink = buildShareLink(fileId);

  // dir = story/manga/Genshin Impact/chapter 10/001.png
  const dir = filePath;

  const seperateDir = dir.split(path.sep);

  const storyType = seperateDir[1].toLowerCase();
  const storyName = seperateDir[2];
  const imageName = seperateDir[seperateDir.length - 1];
  const storyNodeNames = seperateDir.slice(3, -2);

  // Add image
  const image = await handleAddImage({ imageUrl: shareLink });
  console.log(image);

  // Add story
  const story = await handleAddStory({
    storyName: storyName,
    storyType: storyType,
  });
  console.log(story);

  // Update cover art for story and terminate this
  if (path.parse(image.url).name === "cover_art") {
    await handleAddCoverArtForStory({
      storyId: story.id,
      coverArtId: image.id,
    });
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
    console.log(storyNode);

    parentId = storyNode.id;
  }
  const storyNodeId = parentId;

  // Update content for storyNode
  const content = {
    type: "image",
    image_url: image.url,
  };

  addContentForStoryNodeUsingMap({ storyNodeId, content });
  // const updateStoryNodeContent = await handleAddContentForStoryNode({
  //   storyNodeId: storyNodeId,
  //   content: content,
  // });
}

const handleAddStory = async ({ storyName = "", storyType = "", covertArtId = "" }) => {
  const isAdd = alreadyAdd[storyType]?.[storyName];
  if (isAdd) {
    return isAdd;
  }

  const story = await db.story.upsert({
    where: {
      title: storyName,
      type: storyType,
    },
    update: {},
    create: {
      title: storyName,
      type: storyType,
      ...(covertArtId && {
        cover_art: {
          connect: { id: covertArtId },
        },
      }),
    },
  });

  setDeep(alreadyAdd, [storyType, storyName], story);

  return story;
};

const handleAddStoryNode = async ({ storyNodeName = "", storyId, parentId }) => {
  const seperateStoryNodeName = storyNodeName.split(" ");
  const storyNodeType = seperateStoryNodeName[0].toLowerCase();
  const storyNodeIndex = Number(seperateStoryNodeName[1]);

  const isAdd = alreadyAdd?.[storyNodeName]?.[storyId]?.[parentId];
  if (isAdd) return isAdd;

  return await db.$transaction(async (db) => {
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

    setDeep(alreadyAdd, [storyNodeName, storyId, parentId]);

    return storyNode;
  });
};

const handleAddImage = async ({ imageUrl = "" }) => {
  const isAdd = alreadyAdd?.[imageUrl];
  if (isAdd) return isAdd;

  const image = await db.image.upsert({
    where: { url: imageUrl },
    update: {},
    create: { url: imageUrl },
  });

  setDeep(alreadyAdd, [imageUrl], image);

  return image;
};

function addContentForStoryNodeUsingMap({ storyNodeId, content }) {
  const oldContent = storyNodeContent.get(storyNodeId) ?? [];

  const newContent = oldContent;
  newContent.push(content);

  storyNodeContent.set(storyNodeId, newContent);
}

const handleAddContentForStoryNode = async ({ storyNodeId = "", content = {} }) => {
  const storyNode = await db.storyNode.findFirst({
    where: { id: storyNodeId },
  });
  if (!storyNode) {
    setTimeout(() => {
      // Sleep
      console.log("Can not find story node id = ", storyNodeId, ". Retry in 5s");
    }, 5000);
    return handleAddContentForStoryNode({
      storyNodeId: storyNodeId,
      content: content,
    });
  }

  const oldContent = storyNode.content || [];

  const newContent = oldContent;
  newContent.push(content);

  const updateStoryNode = await db.storyNode.update({
    where: {
      id: storyNodeId,
    },
    data: {
      content: newContent,
    },
  });

  return updateStoryNode;
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

for (const file of allFiles) {
  if (file.mimeType !== "application/vnd.google-apps.folder") {
    await handleAdd(buildPath(file.id), file.id);
  }
}

for (const [id, value] of storyNodeContent) {
  await handleAddContentForStoryNode({ id, value });
}
