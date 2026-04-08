import db from "../configs/db.js";

import { CreateError } from "../utils/ErrorHandle.js";

const REDIS_TTL = 60 * 30; // 30 minutes

// Đây là hàm lấy version redis. Khi adim thêm mới story thì sẽ update version lên

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
