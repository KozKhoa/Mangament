import db from "../../../configs/db.js";
import { redis } from "../../../configs/redis.js";
import { CreateError } from "../../utils/ErrorHandle.js";
import storyQueue from "../../../worker/queues/story.queue.js";
import redisUtils, { redisTTL } from "../../utils/Redis.js";

export async function BuildStoryChildrenTree(storyId, client = db) {
  if (!storyId) return [];

  const storyNodes = await client.storyNode.findMany({
    where: {
      story_id: storyId,
      deleted_status: "not_deleted",
    },
    select: {
      id: true,
      story_id: true,
      parent_id: true,
      title: true,
      type: true,
      order_index: true,
      number_of_children: true,
      updated_at: true,
      created_at: true,
      deleted_status: true,
      poster_id: true,
    },
    orderBy: { order_index: "asc" },
  });

  const map = new Map();
  for (const node of storyNodes) {
    map.set(node.id, {
      id: node.id,
      story_id: node.story_id,
      parent_id: node.parent_id,
      title: node.title,
      type: node.type,
      order_index: node.order_index,
      number_of_children: node.number_of_children,
      updated_at: node.updated_at,
      created_at: node.created_at,
      deleted_status: node.deleted_status,
      poster_id: node.poster_id,
      children: [],
    });
  }

  const tree = [];
  for (const node of storyNodes) {
    const item = map.get(node.id);
    if (item.parent_id && map.has(item.parent_id)) {
      map.get(item.parent_id).children.push(item);
    } else {
      tree.push(item);
    }
  }

  return tree;
}

export async function SyncStoryChildren(storyId, client = db) {
  if (!storyId) return [];
  const tree = await BuildStoryChildrenTree(storyId, client);

  await client.story.update({
    where: { id: storyId },
    data: { children: tree },
  });

  return tree;
}

/**
 * Lấy danh sách các nút (storyNode) của bộ truyện và lắp ráp thành cấu trúc cây phân cấp (Tree structure).
 * Hỗ trợ cơ chế cache thông minh trong Redis dựa trên version của truyện và node.
 *
 * @param {string} storyId - ID của bộ truyện cần lấy cây phân cấp.
 * @param {string} [storyNodeId] - ID của nút cha (nếu chỉ muốn lấy cây con bắt đầu từ nút này).
 * @param {Object} options - Các tùy chọn lọc dữ liệu bổ sung.
 * @param {boolean} [options.isGettingContent=false] - Có lấy kèm danh sách nội dung/trang (content) và ảnh không.
 * @param {boolean} [options.isGettingTrashNode=false] - Có lấy cả các nút trong thùng rác (đã xóa tạm) không.
 * @param {boolean} [options.isGettingTrashContent=false] - Có lấy cả các trang nội dung trong thùng rác không.
 * @returns {Promise<Array>} Danh sách các nút ở cấp cao nhất kèm thuộc tính `children` chứa các nút con.
 */
export async function BuildStoryTree(storyId, storyNodeId, { isGettingContent = false, isGettingTrashNode = false, isGettingTrashContent = false }) {
  // 1. Lấy version hiện tại của truyện và node trong Redis (dùng để tự động làm mới cache khi có thay đổi)
  const storiesVer = await redisUtils.stories(storyId).get();
  const storyNodeVer = await redisUtils.storyNodes(storyId).get();

  // 2. Tạo Redis key độc nhất kết hợp version và tất cả tham số truy vấn
  const REDIS_KEY = [
    "BuildStoryTree",
    "storiesVer=" + storiesVer,
    "storyNodeVer=" + storyNodeVer,
    "storyId=" + storyId,
    "storyNodeId=" + storyNodeId,
    "isGettingContent=" + isGettingContent,
    "isGettingTrashNode=" + isGettingTrashNode,
    "isGettingTrashContent=" + isGettingTrashContent,
  ].join(":");

  // 3. Kiểm tra dữ liệu trong Redis cache, nếu có thì parse JSON và trả về ngay
  const cached = await redis.get(REDIS_KEY);

  if (cached) return JSON.parse(cached);

  // 4. Truy vấn danh sách storyNode từ cơ sở dữ liệu với điều kiện tương ứng
  const storyNodes = await db.storyNode.findMany({
    where: {
      // Chỉ lấy các nút chưa bị xóa ngoại trừ trường hợp muốn lấy cả thùng rác
      ...(isGettingTrashNode === false && { deleted_status: "not_deleted" }),

      // Đảm bảo nút thuộc về truyện chỉ định và truyện chưa bị xóa
      story: {
        is: { id: storyId, deleted_status: "not_deleted" },
      },

      // Lọc theo nút cha nếu tham số storyNodeId được truyền vào
      ...(storyNodeId && { parent_id: storyNodeId }),
    },
    include: {
      // Lấy kèm nội dung/trang truyện (content) nếu flag isGettingContent = true
      ...(isGettingContent && {
        content: {
          where: {
            ...(isGettingTrashContent === false && { deleted_status: "not_deleted" }),
          },
          include: { image: { where: { deleted_status: "not_deleted" } } },
          orderBy: { order_index: "asc" },
        },
      }),
    },

    orderBy: { order_index: "asc" },
  });

  // 5. Lưu danh sách node vào Map để truy xuất nhanh và gắn sẵn mảng children = []
  const map = new Map();
  for (const node of storyNodes) {
    map.set(node.id, { ...node, children: [] });
  }

  // 6. Lắp ráp cây phân cấp (Tree): Đẩy nút con vào mảng children của nút cha
  const tree = [];
  for (const node of map.values()) {
    if (node.parent_id) {
      map.get(node.parent_id)?.children.push(node);
    } else {
      tree.push(node);
    }
  }

  // 7. Lưu kết quả cây phân cấp đã lắp ráp vào Redis với thời gian hết hạn TTL
  await redis.setex(REDIS_KEY, redisTTL.buildStoryTree, JSON.stringify(tree));

  return tree;
}

export async function GetNewestChapter(storyId, isGettingDeletedNodes = false) {
  const storyVer = await redisUtils.stories(storyId).get();

  const REDIS_KEY = ["GetNewestChapter", "storyVer=" + storyVer, "storyId=" + storyId, "isGettingDeletedNodes=" + isGettingDeletedNodes].join(":");

  const cached = await redis.get(REDIS_KEY);
  if (cached) return JSON.parse(cached);

  // Truy vấn đệ quy lấy chapter mới nhất dựa theo thứ tự cây order_index (path hierarchy)
  const result = await db.$queryRaw`
    WITH RECURSIVE node_hierarchy AS (
      -- 1. Lấy các node ở cấp gốc (parent_id IS NULL)
      SELECT 
        id,
        story_id,
        parent_id,
        title,
        type,
        order_index,
        deleted_status,
        created_at,
        updated_at,
        ARRAY[order_index] AS path
      FROM "StoryNode"
      WHERE story_id = ${storyId}::uuid
        AND parent_id IS NULL
        ${isGettingDeletedNodes ? "" : `AND deleted_status = 'not_deleted'`}
      UNION ALL

      -- 2. Đệ quy kết nối các node con và ghép order_index vào mảng đường dẫn path
      SELECT 
        n.id,
        n.story_id,
        n.parent_id,
        n.title,
        n.type,
        n.order_index,
        n.deleted_status,
        n.created_at,
        n.updated_at,
        h.path || n.order_index AS path
      FROM "StoryNode" n
      INNER JOIN node_hierarchy h ON n.parent_id = h.id
      ${isGettingDeletedNodes ? "" : `WHERE n.deleted_status = 'not_deleted'`}
    )
    SELECT id, story_id, parent_id, title, type, order_index, created_at, updated_at
    FROM node_hierarchy
    WHERE type = 'chapter'
    ORDER BY path DESC
    LIMIT 1;
  `;

  const newestChapter = result?.[0] || null;

  await redis.setex(REDIS_KEY, redisTTL.getNewestChapterForStory, JSON.stringify(newestChapter));

  return newestChapter;
}

export async function UpdateStoryChildren(id, children, editorEmail) {
  const story = await db.story.findUnique({ where: { id: id } });
  if (!story) throw CreateError(400, "Story not found");

  storyQueue.addJob_UpdateStoryChildren(id, children, editorEmail);

  return { success: true, message: "Story children is being updated" };
}
