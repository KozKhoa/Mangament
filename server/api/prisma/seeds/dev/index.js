import db from "../../../configs/db.js";
import { getImagePool } from "./utils.js";
import seedUsers from "./users.js";
import seedGenres from "./genre.js";
import seedAuthors from "./authors.js";
import seedStories from "./stories.js";
import seedComments from "./comments.js";
import seedFavourites from "./favourites.js";

async function main() {
  const startTime = Date.now();
  console.log("==================================================================");
  console.log("🚀 BẮT ĐẦU CHẠY SEEDING DỮ LIỆU DEV (MANGAMENT DEV SEEDS)");
  console.log("==================================================================");

  try {
    // 1. Image pool từ bảng Image hiện có
    const imagePool = await getImagePool(3000);
    console.log(`📸 Image pool khả dụng: ${imagePool.length} ảnh`);

    // 2. Lấy danh sách quốc gia (Nations) hiện có
    const nations = await db.nation.findMany();
    console.log(`🌍 Quốc gia khả dụng: ${nations.length}`);

    // 3. Seeding người dùng dev (admin@gmail.com, user1..10@gmail.com)
    const users = await seedUsers(imagePool, nations);

    // 4. Seeding thể loại (Genres)
    const genres = await seedGenres(imagePool);

    // 5. Seeding tác giả (Authors)
    const authors = await seedAuthors(imagePool, nations);

    // 6. Seeding tác phẩm (Stories), chương (StoryNode), nội dung chương (StoryNodeContent)
    const stories = await seedStories(users, genres, nations, authors, imagePool);

    // 7. Seeding bình luận (Comments)
    const comments = await seedComments(users, stories);

    // 8. Seeding danh sách yêu thích (Favourites)
    await seedFavourites(users, stories);

    // Thống kê kết quả
    const [userCount, genreCount, authorCount, storyCount, nodeCount, contentCount, commentCount, favCount] = await Promise.all([
      db.user.count(),
      db.genre.count(),
      db.author.count(),
      db.story.count(),
      db.storyNode.count(),
      db.storyNodeContent.count(),
      db.comment.count(),
      db.favouriteStory.count(),
    ]);

    const duration = ((Date.now() - startTime) / 1000).toFixed(2);
    console.log("==================================================================");
    console.log(`🎉 HOÀN THÀNH SEEDING TOÀN BỘ DỮ LIỆU DEV TRONG ${duration}s!`);
    console.log("📊 BẢNG THỐNG KÊ DỮ LIỆU HIỆN CÓ TRONG HỆ THỐNG:");
    console.log(`   - Users:              ${userCount}`);
    console.log(`   - Genres:             ${genreCount}`);
    console.log(`   - Authors:            ${authorCount}`);
    console.log(`   - Stories:            ${storyCount}`);
    console.log(`   - Story Nodes:        ${nodeCount}`);
    console.log(`   - Story Node Content: ${contentCount}`);
    console.log(`   - Comments:           ${commentCount}`);
    console.log(`   - Favourite Stories:  ${favCount}`);
    console.log("==================================================================");
  } catch (error) {
    console.error("❌ Lỗi khi thực thi Dev Seeding:", error);
    process.exit(1);
  } finally {
    await db.$disconnect();
  }
}

main();
