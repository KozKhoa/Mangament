import db from "../../../configs/db.js";

let cachedImagePool = null;

/**
 * Lấy danh sách ID ảnh ngẫu nhiên từ bảng Image trong DB để làm cache pool
 * @param {number} limit Số lượng ID ảnh cần cache vào bộ nhớ (mặc định 3000)
 * @returns {Promise<string[]>} Mảng các image ID
 */
export async function getImagePool(limit = 3000) {
  if (cachedImagePool && cachedImagePool.length > 0) {
    return cachedImagePool;
  }

  console.log(`📸 Đang nạp cache image pool (tối đa ${limit} ảnh)...`);
  const images = await db.image.findMany({
    select: { id: true },
    where: { deleted_status: "not_deleted" },
    take: limit,
  });

  if (images.length === 0) {
    console.warn("⚠️ Bảng Image không có dữ liệu! Vui lòng kiểm tra lại DB.");
    return [];
  }

  cachedImagePool = images.map((img) => img.id);
  console.log(`✅ Đã nạp thành công ${cachedImagePool.length} ảnh vào image pool`);
  return cachedImagePool;
}

/**
 * Chọn 1 phần tử ngẫu nhiên từ mảng
 */
export function getRandomItem(array) {
  if (!array || array.length === 0) return null;
  return array[Math.floor(Math.random() * array.length)];
}

/**
 * Chọn tập hợp con gồm n phần tử ngẫu nhiên từ mảng (không trùng)
 */
export function getRandomSubset(array, minCount = 1, maxCount = 3) {
  if (!array || array.length === 0) return [];
  const count = Math.min(array.length, Math.floor(Math.random() * (maxCount - minCount + 1)) + minCount);
  const shuffled = [...array].sort(() => 0.5 - Math.random());
  return shuffled.slice(0, count);
}

/**
 * Sinh số nguyên ngẫu nhiên trong đoạn [min, max]
 */
export function getRandomInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

/**
 * Sinh số thực ngẫu nhiên trong đoạn [min, max] làm tròn 1 chữ số thập phân
 */
export function getRandomFloat(min, max, decimals = 1) {
  const str = (Math.random() * (max - min) + min).toFixed(decimals);
  return parseFloat(str);
}
