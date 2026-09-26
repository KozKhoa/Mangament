const STORY_SEARCH_SIMILARITY = 0.2;

/**
 * Cấu hình thống nhất: Có xóa file ZIP sau khi giải nén và import thành công hay không.
 * Được xác định cố định phía server qua hằng số (hoặc biến môi trường CLEANUP_ZIP_AFTER_PROCESSING),
 * không để client/frontend quyết định.
 */
const ZIP_CLEANUP_AFTER_PROCESSING = process.env.CLEANUP_ZIP_AFTER_PROCESSING !== "false";

export { STORY_SEARCH_SIMILARITY, ZIP_CLEANUP_AFTER_PROCESSING };
