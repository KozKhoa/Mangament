import chokidar from "chokidar";
import path, { parse, sep } from "path";

import db from "../../configs/db.js";

const root = path.resolve("../../../uploads/story");

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

  // Add image
  const image = await handleAddImage({ imageUrl: dir });

  // Add story
  const story = await handleAddStory({
    storyName: storyName,
    storyType: storyType,
  });

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

    parentId = storyNode.id;
  }
  const storyNodeId = parentId;

  // Update content for storyNode
  const content = {
    type: "iamge",
    image_url: image.url,
  };
  const updateStoryNodeContent = await handleAddContentForStoryNode({
    storyNodeId: storyNodeId,
    content: content,
  });
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
      console.error("❌ [Upload.Model.js] Error update change: ", error);
    }
  }
  isProccessingAdding = false;
};

watch.on("add", async (filePath) => {
  addingQueue.push(filePath);
  await ProccessAddingQueue();
});

const handleAddStory = async ({
  storyName = "",
  storyType = "",
  covertArtId = "",
}) => {
  // Skip qua đoạn check story type
  //
  // Kiểm tra sự tồn tại của story
  let story;
  story = await db.story.findFirst({
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
  return story;
};

const handleAddStoryNode = async ({
  storyNodeName = "",
  storyId,
  parentId,
}) => {
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

  return storyNode;
};

const handleAddImage = async ({ imageUrl = "" }) => {
  let image;
  // Kiểm tra sự tồn tại của url
  image = await db.image.findFirst({ where: { url: imageUrl } });

  if (!image) {
    image = await db.image.create({ data: { url: imageUrl } });
    console.log("Added image ", imageUrl);
  }

  return image;
};

const handleAddContentForStoryNode = async ({
  storyNodeId = "",
  content = {},
}) => {
  // Không cần kiểm tra sự tồn tại của storyNodeId vi chắc chắn nó tồn tại

  const storyNode = await db.storyNode.findFirst({
    where: { id: storyNodeId },
  });
  if (!storyNode) {
    setTimeout(() => {
      // Sleep
      console.log(
        "Can not find story node id = ",
        storyNodeId,
        ". Retry in 5s"
      );
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
  coverArtId = "", // This id is from iamge that has already all before
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
