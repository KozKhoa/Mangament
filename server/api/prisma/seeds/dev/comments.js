import db from "../../../configs/db.js";
import { getRandomItem, getRandomInt } from "./utils.js";

const TOP_COMMENT_TEMPLATES = [
  {
    title: "Cốt truyện đỉnh cao!",
    content: "Càng đọc càng bị cuốn theo nhịp điệu của câu chuyện. Tác giả xây dựng thế giới cực kỳ tỉ mỉ và có chiều sâu.",
  },
  {
    title: "Nét vẽ quá cuốn hút",
    content: "Nét vẽ biểu cảm của các nhân vật quá sống động, nhất là những khung cảnh đại cảnh chiến đấu bùng nổ.",
  },
  {
    title: "Main ngầu và quyết đoán",
    content: "Thích nhất tính cách của nhân vật chính, không nhân nhượng với kẻ thù nhưng rất trượng nghĩa với đồng đội.",
  },
  {
    title: "Hóng từng ngày ra chương mới",
    content: "Cái kết của chương này làm mình đứng ngồi không yên, mong nhóm dịch và tác giả ra chương đều đặn nhé!",
  },
  {
    title: "Plot twist không thể ngờ tới",
    content: "Thực sự bất ngờ trước cú lội ngược dòng này, không ai trong diễn đàn có thể đoán trước được kịch bản này luôn!",
  },
  {
    title: "Một siêu phẩm xứng đáng 10/10",
    content: "Mình đã theo dõi bộ này từ những ngày đầu, đến giờ vẫn giữ nguyên vẹn cảm xúc hào hứng mỗi khi có thông báo chap mới.",
  },
  {
    title: "Đọc lại lần thứ 3 vẫn nổi da gà",
    content: "Mỗi lần đọc lại là lại phát hiện thêm nhiều chi tiết ẩn giấu mà tác giả đã khéo léo cài cắm từ chương đầu tiên.",
  },
  {
    title: "Đoạn combat nghẹt thở thực sự",
    content: "Pha combat quá đỉnh cao, từng góc quay, chuyển động và khung thoại đều được bố trí một cách mẫu mực!",
  },
  {
    title: "Cảm xúc dâng trào ở đoạn này",
    content: "Đoạn hội thoại ở khúc giữa mang tính triết lý sâu sắc ghê, làm mình phải dừng lại suy ngẫm một lúc.",
  },
  {
    title: "Tuyệt vời, dịch rất mượt mà",
    content: "Lời văn dịch mượt mà, giữ trọn được văn phong bản gốc. Rất cảm ơn công sức của đội ngũ biên dịch!",
  },
  {
    title: "Xứng đáng lọt vào top bảng xếp hạng",
    content: "Một trong những tác phẩm hay nhất năm nay mà mình từng đọc, chắc chắn sẽ giới thiệu cho bạn bè cùng đọc.",
  },
  {
    title: "Nhân vật phản diện xây dựng quá có chiều sâu",
    content: "Phản diện có động cơ rõ ràng và lý tưởng riêng chứ không hề sáo rỗng, tạo nên xung đột tư tưởng cực kỳ hấp dẫn.",
  },
];

const REPLY_TEMPLATES = [
  {
    title: "Chuẩn luôn bạn ơi",
    content: "Mình cũng cùng quan điểm với bạn! Cảnh này đọc đi đọc lại vẫn thấy xúc động nghẹn ngào.",
  },
  {
    title: "Đồng quan điểm!",
    content: "Đúng vậy luôn á, tác giả gài gắm chi tiết từ tận mấy chục chap trước rồi bây giờ mới bung lụa.",
  },
  {
    title: "Tôi cũng nghĩ y hệt",
    content: "Haha chuẩn luôn, mong là tác giả giữ vững phong độ đỉnh cao này cho tới đại kết cục.",
  },
  {
    title: "Cảm ơn nhóm dịch",
    content: "Cảm ơn nhóm dịch đã mang đến bản dịch chất lượng và trau chuốt từng câu chữ thế này!",
  },
  {
    title: "Phần sau còn bất ngờ hơn nữa",
    content: "Ai đọc bản gốc rồi thì biết, các chương kế tiếp mạch truyện còn bùng nổ hơn gấp bội lần nữa cơ.",
  },
  {
    title: "Công nhận đoạn này đỉnh",
    content: "Đồng ý 100%, đây chính là khoảnh khắc bước ngoặt thay đổi hoàn toàn cục diện toàn bộ tác phẩm!",
  },
];

export default async function seedComments(users = [], stories = []) {
  console.log("💬 Đang seeding bình luận (Comments)...");

  if (!users || users.length === 0 || !stories || stories.length === 0) {
    console.warn("⚠️ Thiếu users hoặc stories để tạo comment!");
    return [];
  }

  const existingCount = await db.comment.count();
  if (existingCount >= 50) {
    console.log(`  * Đã có ${existingCount} bình luận trong hệ thống, bỏ qua tạo mới.`);
    return await db.comment.findMany({ take: 50 });
  }

  const createdTopComments = [];

  // Tạo khoảng 45 - 60 top comments trên các stories
  for (const story of stories) {
    // 2-4 bình luận cho mỗi truyện
    const commentCount = getRandomInt(2, 4);

    for (let i = 0; i < commentCount; i++) {
      const user = getRandomItem(users);
      const template = getRandomItem(TOP_COMMENT_TEMPLATES);

      // 50% cơ hội comment vào chapter (nếu truyện có children nodes), 50% vào truyện chính
      let targetNodeId = null;
      if (story.children && story.children.length > 0 && Math.random() > 0.4) {
        const randomChapter = getRandomItem(story.children);
        targetNodeId = randomChapter.id;
      }

      const comment = await db.comment.create({
        data: {
          story_id: story.id,
          story_node_id: targetNodeId,
          user_id: user.id,
          title: template.title,
          content: template.content,
        },
      });

      createdTopComments.push(comment);
    }
  }

  console.log(`  + Đã tạo ${createdTopComments.length} bình luận gốc`);

  // Tạo 25 - 35 bình luận trả lời (nested replies)
  let replyCount = 0;
  for (const parentComment of createdTopComments) {
    // 50% cơ hội có 1-2 comment trả lời
    if (Math.random() > 0.5) {
      const numReplies = getRandomInt(1, 2);
      for (let r = 0; r < numReplies; r++) {
        const replyUser = getRandomItem(users.filter((u) => u.id !== parentComment.user_id)) || getRandomItem(users);
        const replyTemplate = getRandomItem(REPLY_TEMPLATES);

        await db.comment.create({
          data: {
            parent_id: parentComment.id,
            story_id: parentComment.story_id,
            story_node_id: parentComment.story_node_id,
            user_id: replyUser.id,
            title: replyTemplate.title,
            content: replyTemplate.content,
          },
        });
        replyCount++;
      }
    }
  }

  console.log(`  + Đã tạo ${replyCount} phản hồi (replies)`);
  console.log(`✅ Hoàn thành seeding bình luận (tổng cộng ${createdTopComments.length + replyCount} comments mới)`);

  return createdTopComments;
}
