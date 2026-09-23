import db from "../../../configs/db.js";
import { faker } from "@faker-js/faker";
import { getRandomItem, getRandomSubset, getRandomInt, getRandomFloat } from "./utils.js";

const STORIES_LIST = [
  {
    title: "One Piece",
    other_titles: ["Đảo Hải Tặc", "Vua Hải Tặc", "ワンピース"],
    type: "manga",
    status: "ongoing",
    authorName: "Eiichiro Oda",
    genreNames: ["Action", "Adventure", "Comedy", "Shonen", "Fantasy"],
    summary:
      "Gol D. Roger, Vua Hải Tặc huyền thoại, trước khi bị xử tử đã tiết lộ kho báu vĩ đại nhất thế giới One Piece được cất giấu tại Đại Hải Trình. Monkey D. Luffy, một cậu bé mang ước mơ trở thành Vua Hải Tặc mới, cùng băng Mũ Rơm bắt đầu chuyến hành trình vĩ đại vượt đại dương.",
  },
  {
    title: "Jujutsu Kaisen",
    other_titles: ["Chú Thuật Hồi Chiến", "呪術廻戦"],
    type: "manga",
    status: "finished",
    authorName: "Gege Akutami",
    genreNames: ["Action", "Supernatural", "Shonen", "Dark Fantasy"],
    summary:
      "Itadori Yuji nuốt ngón tay của Chú vương Ryomen Sukuna để cứu bạn bè, từ đó bước chân vào thế giới của các Chú thuật sư, đối đầu với những Nguyền hồn nguy hiểm bảo vệ nhân loại.",
  },
  {
    title: "Chainsaw Man",
    other_titles: ["Người Cưa", "チェンソーマン"],
    type: "manga",
    status: "ongoing",
    authorName: "Tatsuki Fujimoto",
    genreNames: ["Action", "Dark Fantasy", "Horror", "Seinen", "Comedy"],
    summary:
      "Denji là một thanh niên nghèo khổ sống cùng Quỷ Cưa Pochita. Sau khi bị hãm hại, Denji hòa làm một với Pochita, hồi sinh thành Chainsaw Man và gia nhập Đội Diệt Quỷ của Cục An Ninh Dân Sự.",
  },
  {
    title: "Berserk",
    other_titles: ["Kiếm Sĩ Đen", "ベルセルク"],
    type: "manga",
    status: "ongoing",
    authorName: "Kentaro Miura",
    genreNames: ["Dark Fantasy", "Action", "Seinen", "Tragedy", "Drama"],
    summary:
      "Hành trình đầy máu và nước mắt của Guts, chàng kiếm sĩ đơn độc mang theo thanh cự kiếm Dragon Slayer, chiến đấu chống lại số phận nghiệt ngã và binh đoàn quỷ dữ của God Hand.",
  },
  {
    title: "Bleach",
    other_titles: ["Sứ Mạng Thần Chết", "ブリーチ"],
    type: "manga",
    status: "finished",
    authorName: "Tite Kubo",
    genreNames: ["Action", "Supernatural", "Shonen", "Fantasy"],
    summary:
      "Kurosaki Ichigo vô tình nhận được sức mạnh của Tử thần từ Kuchiki Rukia. Cậu gánh vác trách nhiệm bảo vệ người sống lẫn linh hồn người chết khỏi các Hollow tàn bạo.",
  },
  {
    title: "One Punch Man",
    other_titles: ["Thánh Phồng Tôm", "ワンパンマン"],
    type: "manga",
    status: "ongoing",
    authorName: "ONE",
    genreNames: ["Action", "Comedy", "Parody", "Shonen", "Supernatural"],
    summary:
      "Saitama, một anh hùng vì sở thích, sở hữu sức mạnh vô địch có thể hạ gục bất kỳ quái vật nào chỉ bằng một cú đấm duy nhất. Nhưng chính sức mạnh tuyệt đối lại khiến anh luôn cảm thấy nhàm chán.",
  },
  {
    title: "Dragon Ball Super",
    other_titles: ["7 Viên Ngọc Rồng Siêu Cấp", "ドラゴンボール超"],
    type: "manga",
    status: "ongoing",
    authorName: "Akira Toriyama",
    genreNames: ["Action", "Adventure", "Martial Arts", "Shonen", "Science Fiction"],
    summary:
      "Tiếp nối sau chiến thắng trước Majin Buu, Goku và Vegeta bước vào cảnh giới sức mạnh của các vị Thần Hủy Diệt và tham gia Đại hội Võ thuật giữa các Đa vũ trụ.",
  },
  {
    title: "JoJo's Bizarre Adventure",
    other_titles: ["Cuộc Phiêu Lưu Kì Thú Của JoJo", "ジョジョの奇妙な冒険"],
    type: "manga",
    status: "ongoing",
    authorName: "Hirohiko Araki",
    genreNames: ["Action", "Adventure", "Supernatural", "Seinen", "Mystery"],
    summary:
      "Biên niên sử kéo dài nhiều thế hệ của dòng họ Joestar trong cuộc chiến chống lại cái ác và các thế lực siêu nhiên thông qua sức mạnh kì bí của Gợn sóng (Hamon) và Stand.",
  },
  {
    title: "Tokyo Ghoul",
    other_titles: ["Ngạ Quỷ Vùng Tokyo", "東京喰種"],
    type: "manga",
    status: "finished",
    authorName: "Sui Ishida",
    genreNames: ["Dark Fantasy", "Horror", "Action", "Psychology", "Seinen"],
    summary:
      "Kaneki Ken trở thành bán ghoul sau một ca cấy ghép nội tạng định mệnh. Cậu phải vật lộn giữa nhân tính con người và bản năng khát máu của loài ngạ quỷ.",
  },
  {
    title: "Solo Leveling",
    other_titles: ["Tôi Thăng Cấp Một Mình", "나 혼자만 레벨업"],
    type: "manga",
    status: "finished",
    authorName: "Chugong",
    genreNames: ["Action", "Fantasy", "Supernatural", "Adventure"],
    summary:
      "Sung Jin-woo, thợ săn yếu nhất thế giới cấp E, bất ngờ nhận được hệ thống nhiệm vụ bí ẩn chỉ có riêng anh nhìn thấy, mở ra con đường trở thành Thợ săn mạnh nhất hành tinh.",
  },
  {
    title: "Demon Slayer: Kimetsu no Yaiba",
    other_titles: ["Thanh Gươm Diệt Quỷ", "鬼滅の刃"],
    type: "manga",
    status: "finished",
    authorName: "Koyoharu Gotouge",
    genreNames: ["Action", "Fantasy", "Historical Fiction", "Shonen", "Supernatural"],
    summary:
      "Gia đình bị sát hại dã man và em gái Nezuko bị biến thành quỷ, Tanjiro gia nhập Sát Quỷ Đội với quyết tâm tiêu diệt Chúa quỷ Kibutsuji Muzan và tìm cách biến em gái trở lại thành người.",
  },
  {
    title: "Spy x Family",
    other_titles: ["Gia Đình Điệp Viên", "スパイファミリー"],
    type: "manga",
    status: "ongoing",
    authorName: "Tatsuya Endo",
    genreNames: ["Comedy", "Action", "Slice of Life", "Shonen"],
    summary:
      "Điệp viên hàng đầu Twilight cần xây dựng một gia đình giả để hoàn thành chiến dịch tối mật. Anh vô tình nhận nuôi Anya - một cô bé có năng lực đọc suy nghĩ, và kết hôn cùng Yor - một nữ sát thủ ngầm khét tiếng.",
  },
  {
    title: "Blue Lock",
    other_titles: ["Tiền Đạo Số 1", "ブルーロック"],
    type: "manga",
    status: "ongoing",
    authorName: "Muneyuki Kaneshiro",
    genreNames: ["Sports", "Shonen", "Drama", "Psychology"],
    summary:
      "Liên đoàn bóng đá Nhật Bản khởi động dự án đào tạo khắc nghiệt Blue Lock nhằm tôi luyện một tiền đạo ích kỷ và xuất sắc nhất, dẫn dắt đội tuyển quốc gia chinh phục cúp vô địch thế giới.",
  },
  {
    title: "Death Note",
    other_titles: ["Cuốn Sổ Tử Thần", "デスノート"],
    type: "manga",
    status: "finished",
    authorName: "Tsugumi Ohba",
    genreNames: ["Mystery", "Psychology", "Supernatural", "Detective", "Shonen"],
    summary:
      "Yagami Raito, một học sinh thiên tài, nhặt được cuốn sổ của thần chết Ryuk có thể đoạt mạng bất kỳ ai chỉ bằng cách ghi tên vào. Cuộc đấu trí đỉnh cao giữa Raito và thám tử huyền thoại L bùng nổ.",
  },
  {
    title: "Overlord",
    other_titles: ["Kẻ Thống Trị", "オーバーロード"],
    type: "light_novel",
    status: "ongoing",
    authorName: "Kugane Maruyama",
    genreNames: ["Isekai", "Dark Fantasy", "Action", "Fiction"],
    summary:
      "Khi tựa game thực tế ảo YGGDRASIL đóng cửa, Momonga ở lại đến giây phút cuối cùng và bị dịch chuyển sang một thế giới hoàn toàn mới cùng toàn bộ Đại Lăng Tẩm Nazarick. Chàng pháp sư Undead bắt đầu công cuộc chinh phạt thế giới.",
  },
  {
    title: "Re:Zero - Starting Life in Another World",
    other_titles: ["Bắt Đầu Lại Ở Thế Giới Khác", "Re:ゼロから始める異世界生活"],
    type: "light_novel",
    status: "ongoing",
    authorName: "Tappei Nagatsuki",
    genreNames: ["Isekai", "Fantasy", "Drama", "Psychology", "Dark Fantasy"],
    summary:
      "Natsuki Subaru bất ngờ bị triệu hồi sang một thế giới giả tưởng và nhận ra mình sở hữu quyền năng duy nhất: Trở Về Từ Cõi Chết. Mỗi lần hy sinh là một lần bắt đầu lại, vượt qua vô vàn đau đớn để cứu người mình yêu quý.",
  },
  {
    title: "Mushoku Tensei: Isekai Ittara Honki Dasu",
    other_titles: ["Thất Nghiệp Chuyển Sinh", "無職転生"],
    type: "light_novel",
    status: "finished",
    authorName: "Rifujin na Magonote",
    genreNames: ["Isekai", "Fantasy", "Adventure", "Drama", "Ecchi"],
    summary:
      "Một người đàn ông 34 tuổi thất nghiệp chết trong tai nạn và được tái sinh trong hình hài một đứa trẻ mang tên Rudeus Greyrat tại thế giới kiếm và ma thuật. Cậu quyết tâm sống một cuộc đời trọn vẹn và không hối tiếc.",
  },
  {
    title: "Sword Art Online",
    other_titles: ["Đao Kiếm Thần Vực", "ソードアート・オンライン"],
    type: "light_novel",
    status: "ongoing",
    authorName: "Reki Kawahara",
    genreNames: ["Action", "Adventure", "Science Fiction", "Romance", "Fantasy"],
    summary:
      "Hàng ngàn người chơi bị mắc kẹt trong trò chơi thực tế ảo SAO, nơi 'Game Over' đồng nghĩa với cái chết thực sự ngoài đời thực. Kiếm sĩ Kirito phải chiến đấu vượt qua 100 tầng tháp Aincrad để giải cứu tất cả.",
  },
  {
    title: "Classroom of the Elite",
    other_titles: ["Lớp Học Đề Cao Thực Lực", "ようこそ実力至上主義の教室へ"],
    type: "light_novel",
    status: "ongoing",
    authorName: "Shogo Kinugasa",
    genreNames: ["Psychology", "Drama", "Slice of Life", "Mystery"],
    summary:
      "Trường trung học cao cấp Koudo Ikusei là nơi chỉ đánh giá học sinh dựa trên năng lực và điểm số tuyệt đối. Ayanokouji Kiyotaka, một học sinh bí ẩn cố tình che giấu trí tuệ và năng lực thượng thừa, xếp vào lớp D thấp nhất.",
  },
  {
    title: "No Game No Life",
    other_titles: ["Không Trò Chơi Không Cuộc Sống", "ノーゲーム・ノーライフ"],
    type: "light_novel",
    status: "ongoing",
    authorName: "Yuu Kamiya",
    genreNames: ["Isekai", "Comedy", "Fantasy", "Ecchi"],
    summary:
      "Hai anh em thiên tài game thủ Sora và Shiro được Thần trò chơi Tet triệu hồi tới Disboard - một thế giới nơi mọi xung đột, từ cướp đoạt lãnh thổ đến biên giới quốc gia, đều phải phân định bằng trò chơi.",
  },
  {
    title: "That Time I Got Reincarnated as a Slime",
    other_titles: ["Về Chuyện Tôi Chuyển Sinh Thành Slime", "転生したらスライムだった件"],
    type: "light_novel",
    status: "ongoing",
    authorName: "Fuse",
    genreNames: ["Isekai", "Fantasy", "Adventure", "Comedy"],
    summary:
      "Sau khi bị đâm chết trên phố, Satoru Mikami chuyển sinh thành một con Slime tại thế giới ma thuật với kỹ năng Đại Hiền Triết và Kẻ Săn Mồi. Rimuru Tempest bắt đầu hành trình xây dựng một vương quốc hòa bình cho mọi chủng tộc.",
  },
  {
    title: "The Eminence in Shadow",
    other_titles: ["Chúa Tể Bóng Tối", "陰の実力者になりたくて!"],
    type: "light_novel",
    status: "ongoing",
    authorName: "Daisuke Aizawa",
    genreNames: ["Action", "Comedy", "Fantasy", "Parody", "Isekai"],
    summary:
      "Cid Kagenou luôn mơ ước trở thành kẻ giật dây trong bóng tối. Sau khi chuyển sinh sang thế giới phép thuật, những câu chuyện bịa đặt tưởng như vô lý của Cid hóa ra lại hoàn toàn có thật trong cuộc chiến chống lại Giáo đoàn Diablos.",
  },
  {
    title: "Monogatari Series",
    other_titles: ["Hóa Vật Ngữ", "物語シリーズ"],
    type: "light_novel",
    status: "ongoing",
    authorName: "NisiOisiN",
    genreNames: ["Supernatural", "Psychology", "Mystery", "Romance"],
    summary:
      "Araragi Koyomi, một nam sinh từng biến thành ma cà rồng và đã lấy lại được nhân tính, liên tục gặp gỡ và giúp đỡ những cô gái vướng phải các hiện tượng quái dị (Kaii) siêu nhiên kỳ bí.",
  },
  {
    title: "Your Name",
    other_titles: ["Kimi no Na wa", "君の名は。"],
    type: "light_novel",
    status: "finished",
    authorName: "Makoto Shinkai",
    genreNames: ["Romance", "Drama", "Supernatural", "Slice of Life"],
    summary:
      "Mitsuha, một nữ sinh ở vùng thôn quê hẻo lánh, và Taki, một nam sinh sống tại Tokyo náo nhiệt, bất ngờ trải qua hiện tượng hoán đổi thân xác kỳ lạ trong giấc mơ, dẫn đến một mối liên kết định mệnh vượt không thời gian.",
  },
];

const CHAPTER_TITLES_MANGA = [
  "Khởi đầu hành trình",
  "Kẻ thù xuất hiện",
  "Sức mạnh thức tỉnh",
  "Quyết chiến nghẹt thở",
  "Lời thề danh dự",
  "Bí mật hé lộ",
  "Bước ngoặt định mệnh",
  "Tia hy vọng mong manh",
  "Vượt qua giới hạn",
  "Khúc ca chiến thắng",
];

const CHAPTER_TITLES_NOVEL = [
  "Mở màn: Thế giới mới",
  "Gặp gỡ định mệnh",
  "Cơn sóng ngầm trỗi dậy",
  "Hiểm họa cận kề",
  "Ánh sáng trong bóng tối",
  "Chiến lược bất ngờ",
  "Kế hoạch xoay chuyển",
  "Đối đầu kẻ thù truyền kiếp",
];

export default async function seedStories(users = [], genres = [], nations = [], authors = [], imagePool = []) {
  console.log("📚 Đang seeding danh sách tác phẩm (Stories) và các chương (StoryNode, Content)...");

  const seededStories = [];
  const japanNation = nations.find((n) => n.name.toLowerCase().includes("japan") || n.name.toLowerCase().includes("nhật")) || nations[0];

  for (const template of STORIES_LIST) {
    let story = await db.story.findUnique({
      where: { title: template.title },
      include: {
        children: true,
      },
    });

    if (!story) {
      const coverArtId = imagePool.length > 0 ? getRandomItem(imagePool) : null;
      const poster = users.length > 0 ? getRandomItem(users) : null;
      const author = authors.find((a) => a.name === template.authorName) || getRandomItem(authors);

      // Map genres
      const matchedGenres = genres.filter((g) => template.genreNames.includes(g.name));
      const chosenGenres = matchedGenres.length > 0 ? matchedGenres : getRandomSubset(genres, 2, 4);

      story = await db.story.create({
        data: {
          title: template.title,
          other_titles: template.other_titles,
          type: template.type,
          status: template.status,
          summary: template.summary,
          view: getRandomInt(1000, 120000),
          star: getRandomFloat(3.9, 5.0, 1),
          rating_count: getRandomInt(15, 600),
          next_chapter_in: template.status === "ongoing" ? new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) : null,
          cover_art_id: coverArtId,
          poster_id: poster?.id || null,
          nation_id: japanNation?.id || null,
          authors: author
            ? {
                create: {
                  author_id: author.id,
                },
              }
            : undefined,
          genres: {
            create: chosenGenres.map((g) => ({
              genre_id: g.id,
            })),
          },
        },
        include: {
          children: true,
        },
      });

      console.log(`  + Đã tạo truyện: "${story.title}" (${story.type}, ${story.status})`);
    } else {
      console.log(`  * Đã tồn tại truyện: "${story.title}"`);
    }

    // Kiểm tra nếu truyện chưa có chapter thì tạo các chapter (StoryNode) và nội dung (StoryNodeContent)
    if (!story.children || story.children.length === 0) {
      console.log(`    -> Đang tạo chương & nội dung cho truyện "${story.title}"...`);
      const isManga = story.type === "manga";
      const chapterTitles = isManga ? CHAPTER_TITLES_MANGA : CHAPTER_TITLES_NOVEL;
      const chapterCount = isManga ? getRandomInt(6, 10) : getRandomInt(5, 8);

      let createdChapterCount = 0;

      for (let i = 1; i <= chapterCount; i++) {
        const titleSuffix = chapterTitles[i - 1] || `Phần thứ ${i}`;
        const nodeTitle = `Chương ${i}: ${titleSuffix}`;

        const storyNode = await db.storyNode.create({
          data: {
            story_id: story.id,
            title: nodeTitle,
            type: "chapter",
            order_index: i,
            view: getRandomInt(200, 8000),
            poster_id: story.poster_id,
          },
        });

        // Tạo nội dung trang hoặc text cho chapter
        if (isManga) {
          // Manga: 6 - 10 trang ảnh ngẫu nhiên từ imagePool
          const pageCount = getRandomInt(6, 10);
          const contentsData = [];
          for (let page = 1; page <= pageCount; page++) {
            const imageId = imagePool.length > 0 ? getRandomItem(imagePool) : null;
            contentsData.push({
              story_node_id: storyNode.id,
              type: "image",
              order_index: page,
              image_id: imageId,
            });
          }
          await db.storyNodeContent.createMany({
            data: contentsData,
          });
        } else {
          // Light Novel: 1 ảnh minh họa đầu chương + 4 - 6 đoạn text
          const contentsData = [];
          // Ảnh minh họa đầu chương
          if (imagePool.length > 0) {
            contentsData.push({
              story_node_id: storyNode.id,
              type: "image",
              order_index: 1,
              image_id: getRandomItem(imagePool),
            });
          }

          const paragraphCount = getRandomInt(4, 6);
          for (let p = 1; p <= paragraphCount; p++) {
            const paragraphText = faker.lorem.paragraphs(getRandomInt(2, 3), "\n\n");
            contentsData.push({
              story_node_id: storyNode.id,
              type: "text",
              order_index: contentsData.length + 1,
              content: paragraphText,
            });
          }

          await db.storyNodeContent.createMany({
            data: contentsData,
          });
        }

        createdChapterCount++;
      }

      // Cập nhật number_of_children trên story
      await db.story.update({
        where: { id: story.id },
        data: {
          number_of_children: createdChapterCount,
        },
      });

      // Lấy lại các StoryNode mới tạo để return
      story.children = await db.storyNode.findMany({
        where: { story_id: story.id, deleted_status: "not_deleted" },
        orderBy: { order_index: "asc" },
      });
      console.log(`    ✅ Đã tạo xong ${createdChapterCount} chương cho "${story.title}"`);
    }

    seededStories.push(story);
  }

  // Also include any previously existing stories that weren't in the list
  const allStories = await db.story.findMany({
    where: { deleted_status: "not_deleted" },
    include: {
      children: {
        where: { deleted_status: "not_deleted" },
        take: 5,
      },
    },
  });

  console.log(`✅ Hoàn thành seeding tổng cộng ${allStories.length} tác phẩm trong hệ thống`);
  return allStories;
}
