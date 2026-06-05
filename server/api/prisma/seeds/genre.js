import db from "../../configs/db.js";

const GENRES = [
  {
    name: "Action",
    description: "Thể loại tập trung vào các trận chiến, hành động, xung đột và những tình huống căng thẳng tốc độ cao.",
  },
  {
    name: "Adventure",
    description: "Những cuộc phiêu lưu, khám phá vùng đất mới và hành trình đầy thử thách.",
  },
  {
    name: "Comedy",
    description: "Thể loại mang tính giải trí, hài hước, tạo tiếng cười thông qua tình huống hoặc nhân vật.",
  },
  {
    name: "Crime",
    description: "Câu chuyện xoay quanh tội phạm, thế giới ngầm, điều tra hoặc các hoạt động phi pháp.",
  },
  {
    name: "Cyberpunk",
    description: "Bối cảnh tương lai công nghệ cao nhưng xã hội suy tàn, thường liên quan đến AI, mạng và máy móc.",
  },
  {
    name: "Dark Fantasy",
    description: "Fantasy mang màu sắc u tối, kết hợp yếu tố kinh dị, bạo lực hoặc bi kịch.",
  },
  {
    name: "Detective",
    description: "Thể loại điều tra, phá án với các nhân vật thám tử hoặc nhà điều tra.",
  },
  {
    name: "Drama",
    description: "Tập trung khai thác cảm xúc, mối quan hệ và xung đột giữa các nhân vật.",
  },
  {
    name: "Dystopian Fiction",
    description: "Bối cảnh xã hội phản địa đàng, nơi con người sống trong sự áp bức hoặc hỗn loạn.",
  },
  {
    name: "Ecchi",
    description: "Thể loại có yếu tố gợi cảm, fan service hoặc hài hước liên quan đến tình dục nhẹ.",
  },
  {
    name: "Fairy Tale",
    description: "Những câu chuyện cổ tích với phép thuật, sinh vật huyền bí và bài học ý nghĩa.",
  },
  {
    name: "Fantasy",
    description: "Thế giới giả tưởng với phép thuật, quái vật, thần thoại và các năng lực siêu nhiên.",
  },
  {
    name: "Fiction",
    description: "Những tác phẩm hư cấu được xây dựng từ trí tưởng tượng thay vì sự kiện có thật.",
  },
  {
    name: "Gekiga",
    description: "Phong cách manga trưởng thành với nội dung nghiêm túc, thực tế và chiều sâu tâm lý.",
  },
  {
    name: "Gothic Fiction",
    description: "Truyện mang bầu không khí u ám, bí ẩn, kết hợp kinh dị và yếu tố gothic cổ điển.",
  },
  {
    name: "Harem",
    description: "Một nhân vật chính được nhiều nhân vật khác theo đuổi hoặc có tình cảm.",
  },
  {
    name: "High Fantasy",
    description: "Fantasy quy mô lớn trong thế giới hoàn toàn hư cấu với các cuộc chiến sử thi.",
  },
  {
    name: "Historical",
    description: "Bối cảnh lấy cảm hứng từ các giai đoạn lịch sử hoặc nền văn hóa trong quá khứ.",
  },
  {
    name: "Historical Fiction",
    description: "Tác phẩm hư cấu kết hợp với nhân vật, sự kiện hoặc bối cảnh lịch sử có thật.",
  },
  {
    name: "Horror",
    description: "Thể loại nhằm tạo cảm giác sợ hãi, ám ảnh hoặc căng thẳng cho người đọc.",
  },
  {
    name: "Isekai",
    description: "Nhân vật bị chuyển sinh hoặc dịch chuyển sang một thế giới khác.",
  },
  {
    name: "Josei",
    description: "Truyện hướng đến phụ nữ trưởng thành, thường tập trung vào tình cảm và cuộc sống thực tế.",
  },
  {
    name: "Kodomo",
    description: "Truyện dành cho trẻ em với nội dung đơn giản, vui nhộn và mang tính giáo dục.",
  },
  {
    name: "Literary Fiction",
    description: "Tác phẩm chú trọng chiều sâu nghệ thuật, tâm lý nhân vật và giá trị văn học.",
  },
  {
    name: "Low Fantasy",
    description: "Fantasy có yếu tố phép thuật hạn chế và gần gũi với thế giới thực.",
  },
  {
    name: "Magical Realism",
    description: "Kết hợp hiện thực đời thường với các yếu tố kỳ ảo một cách tự nhiên.",
  },
  {
    name: "Martial Arts",
    description: "Tập trung vào võ thuật, chiến đấu, tu luyện và các môn phái.",
  },
  {
    name: "Mecha",
    description: "Truyện về robot khổng lồ, máy móc hiện đại hoặc chiến tranh cơ giới.",
  },
  {
    name: "Mystery",
    description: "Những bí ẩn, câu đố hoặc sự kiện khó hiểu cần được giải đáp.",
  },
  {
    name: "Parody",
    description: "Nhại lại hoặc châm biếm các tác phẩm, thể loại hoặc tình huống quen thuộc.",
  },
  {
    name: "Post-Apocalyptic",
    description: "Bối cảnh hậu tận thế sau chiến tranh, đại dịch hoặc thảm họa hủy diệt.",
  },
  {
    name: "Psychology",
    description: "Khai thác tâm lý, cảm xúc, hành vi và những xung đột nội tâm của con người.",
  },
  {
    name: "Romance",
    description: "Tập trung vào tình yêu, các mối quan hệ tình cảm và sự phát triển cảm xúc.",
  },
  {
    name: "Science Fiction",
    description: "Khoa học viễn tưởng với công nghệ tương lai, không gian và khám phá khoa học.",
  },
  {
    name: "Seinen",
    description: "Truyện dành cho nam trưởng thành với nội dung phức tạp và chủ đề nghiêm túc.",
  },
  {
    name: "Shojo",
    description: "Truyện hướng đến thiếu nữ, thường tập trung vào tình cảm và cảm xúc.",
  },
  {
    name: "Shonen",
    description: "Truyện dành cho thiếu niên nam với hành động, tình bạn và quá trình trưởng thành.",
  },
  {
    name: "Shoujo Ai",
    description: "Tập trung vào mối quan hệ tình cảm hoặc lãng mạn giữa các nhân vật nữ.",
  },
  {
    name: "Shounen Ai",
    description: "Tập trung vào mối quan hệ tình cảm hoặc lãng mạn giữa các nhân vật nam.",
  },
  {
    name: "Slice of Life",
    description: "Miêu tả cuộc sống thường ngày, những khoảnh khắc đời thường và gần gũi.",
  },
  {
    name: "Space Opera",
    description: "Phiêu lưu khoa học viễn tưởng quy mô lớn trong không gian với nhiều phe phái và chiến tranh.",
  },
  {
    name: "Sport",
    description: "Xoay quanh thể thao, thi đấu, tinh thần đồng đội và sự phát triển bản thân.",
  },
  {
    name: "Steampunk",
    description: "Thế giới công nghệ hơi nước mang phong cách công nghiệp cổ điển.",
  },
  {
    name: "Supernatural",
    description: "Những hiện tượng siêu nhiên như ma quỷ, linh hồn hoặc năng lực bí ẩn.",
  },
  {
    name: "Survival",
    description: "Nhân vật phải đấu tranh sinh tồn trong môi trường hoặc hoàn cảnh khắc nghiệt.",
  },
  {
    name: "Thriller",
    description: "Căng thẳng, hồi hộp với nhiều tình huống nguy hiểm và bất ngờ.",
  },
  {
    name: "Tragedy",
    description: "Những câu chuyện mang màu sắc bi kịch, mất mát và kết thúc đau buồn.",
  },
  {
    name: "Yaoi",
    description: "Truyện về mối quan hệ tình cảm giữa các nhân vật nam, thường hướng đến độc giả nữ.",
  },
  {
    name: "Yuri",
    description: "Truyện về mối quan hệ tình cảm giữa các nhân vật nữ.",
  },
];
export default async function main() {
  console.log("Seeding genres");

  const thumbnailData = GENRES.map((genre) => ({
    url: `${process.env.CDN_URL}/genre/${genre.name.toLowerCase().split(" ").join("_")}.jpg`,
    key: `genre/${genre.name.toLowerCase().split(" ").join("_")}.jpg`,
  }));

  const thumbnail = await db.image.findMany({ where: { key: { in: thumbnailData.map((d) => d.key) } } });

  const thumbnailMap = new Map();
  thumbnail.forEach((image) => {
    thumbnailMap.set(image.key, image.id);
  });

  await db.genre.deleteMany();

  await db.genre.createMany({
    data: GENRES.map((genre) => ({
      name: genre.name,
      description: genre.description,
      thumbnail_id: thumbnailMap.get(`genre/${genre.name.toLowerCase().split(" ").join("_")}.jpg`),
    })),
    skipDuplicates: true,
  });

  console.log("Seeding genres successfully");
}
