import db from "../../../configs/db.js";
import { getRandomSubset } from "./utils.js";

export default async function seedFavourites(users = [], stories = []) {
  console.log("❤️ Đang seeding danh sách yêu thích (Favourite Stories)...");

  if (!users || users.length === 0 || !stories || stories.length === 0) {
    console.warn("⚠️ Thiếu users hoặc stories để tạo favourites!");
    return [];
  }

  let totalFavourites = 0;

  for (const user of users) {
    // Mỗi người dùng yêu thích ngẫu nhiên từ 4 đến 8 truyện
    const favouriteStories = getRandomSubset(stories, 4, 8);

    for (const story of favouriteStories) {
      await db.favouriteStory.upsert({
        where: {
          user_id_story_id: {
            user_id: user.id,
            story_id: story.id,
          },
        },
        update: {},
        create: {
          user_id: user.id,
          story_id: story.id,
        },
      });
      totalFavourites++;
    }
  }

  const count = await db.favouriteStory.count();
  console.log(`✅ Hoàn thành seeding danh sách yêu thích (tổng cộng ${count} lượt thích trong hệ thống)`);

  return totalFavourites;
}
