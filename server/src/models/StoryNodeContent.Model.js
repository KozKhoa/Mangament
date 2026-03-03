import db from "../configs/db.js";
import { StoryNodeType } from "../configs/db.js";
import { redis } from "../configs/redis.js";
import { CreateError } from "../utils/ErrorHandle.js";

import { BuildStoryTree, UpdateStory } from "./Story.Model.js";

const REDIS_TTL = 60 * 30; // 30 minutes

// Đây là hàm lấy version redis. Khi adim thêm mới story thì sẽ update version lên
async function getRedisStoryNodeContentVersion() {
  const versionKey = `version:storyNodes`;
  let version = await redis.get(versionKey);

  if (!version) {
    version = 1;
    await redis.set(versionKey, version);
  }

  return version;
}

// Đây là hàm dùng để tăng version cho việc lấy và build story
async function incrRedisStoryNodeContentVersion() {
  await redis.incr(`version:storyNodes`);
}

export async function DeleteStoryNodeContent(id) {
  if (!id) throw CreateError(400, "Required 'id' to remove");

  await db.storyNodeContent.delete({ where: { id: id } });

  return { success: true };
}

export async function DeleteManyStoryNodeContent(id = []) {
  if (!id || id.length < 1) throw CreateError(400, "Required '[id]' to remove");

  await db.storyNodeContent.deleteMany({ where: { id: { in: id } } });

  return { success: true };
}
