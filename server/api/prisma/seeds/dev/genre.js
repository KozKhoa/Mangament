import db from "../../../configs/db.js";
import { getRandomItem } from "./utils.js";

const GENRES_LIST = [
  { name: "Action", description: "Tập trung vào các trận chiến, hành động kịch tính và tốc độ cao." },
  { name: "Adventure", description: "Những chuyến phiêu lưu kỳ thú, khám phá vùng đất mới đầy mạo hiểm." },
  { name: "Comedy", description: "Hài hước, vui nhộn, mang lại tiếng cười sảng khoái và giải trí nhẹ nhàng." },
  { name: "Crime", description: "Thế giới tội phạm, thế giới ngầm, cảnh sát và các phi vụ li kỳ." },
  { name: "Cyberpunk", description: "Thế giới tương lai công nghệ cao nhưng xã hội đen tối, máy móc và AI." },
  { name: "Dark Fantasy", description: "Thế giới giả tưởng tăm tối, ranh giới mỏng manh giữa thiện và ác." },
  { name: "Detective", description: "Trinh thám phá án, đấu trí căng thẳng và logic sắc bén." },
  { name: "Drama", description: "Tập trung khai thác chiều sâu tâm lý, cảm xúc và xung đột nhân vật." },
  { name: "Dystopian Fiction", description: "Xã hội phản địa đàng, con người đấu tranh dưới ách thống trị." },
  { name: "Ecchi", description: "Yếu tố gợi cảm, hài hước và tình huống lãng mạn nhẹ." },
  { name: "Fairy Tale", description: "Cổ tích thần thoại, phép màu và những câu chuyện kỳ diệu." },
  { name: "Fantasy", description: "Thế giới giả tưởng với ma thuật, quái vật, rồng và kiếm thuật." },
  { name: "Fiction", description: "Tác phẩm hư cấu từ trí tưởng tượng phong phú của tác giả." },
  { name: "Gekiga", description: "Phong cách truyện tranh trưởng thành, hiện thực và sâu sắc." },
  { name: "Harem", description: "Nhân vật chính được nhiều người thầm thương trộm nhớ." },
  { name: "Historical Fiction", description: "Bối cảnh lịch sử, triều đại hào hùng và các biến cố thời đại." },
  { name: "Horror", description: "Kinh dị, rùng rợn, hồi hộp thót tim với yếu tố siêu nhiên kỳ bí." },
  { name: "Isekai", description: "Xuyên không, chuyển sinh sang một thế giới khác đầy mới lạ." },
  { name: "Josei", description: "Truyện tranh hướng đến đối tượng phụ nữ trưởng thành, tình cảm thực tế." },
  { name: "Kodomo", description: "Truyện thiếu nhi vui nhộn, trong sáng và mang tính giáo dục." },
  { name: "Low Fantasy", description: "Thế giới thực có xen lẫn một số yếu tố ma thuật huyền bí." },
  { name: "Martial Arts", description: "Võ thuật, tu tiên, kiếm hiệp với những chiêu thức uy lực." },
  { name: "Mecha", description: "Robot khổng lồ, chiến tranh máy móc hiện đại và công nghệ tương lai." },
  { name: "Mystery", description: "Bí ẩn, ly kỳ, những hiện tượng kỳ lạ chưa có lời giải đáp." },
  { name: "Parody", description: "Nhại lại và chế giễu hài hước các tác phẩm hoặc hiện tượng nổi tiếng." },
  { name: "Psychology", description: "Tâm lý học phức tạp, đấu trí nghẹt thở và bí ẩn nội tâm." },
  { name: "Romance", description: "Tình cảm lãng mạn, ngọt ngào và rung động lứa đôi." },
  { name: "Science Fiction", description: "Khoa học viễn tưởng, vũ trụ, du hành thời gian và chiều không gian." },
  { name: "Seinen", description: "Dành cho nam giới trưởng thành với cốt truyện sâu sắc, gai góc." },
  { name: "Shonen", description: "Dành cho thiếu niên, nhiệt huyết, tình bạn và nỗ lực vươn lên." },
  { name: "Shojo", description: "Dành cho thiếu nữ, cảm xúc nhẹ nhàng và những rung động đầu đời." },
  { name: "Slice of Life", description: "Lát cắt cuộc sống đời thường bình yên, nhẹ nhàng và chữa lành." },
  { name: "Sports", description: "Thể thao, thi đấu nảy lửa, ý chí kiên cường và tinh thần đồng đội." },
  { name: "Supernatural", description: "Siêu nhiên, linh hồn, ma quỷ và các năng lực huyền bí." },
  { name: "Thriller", description: "Giật gân, nhịp độ dồn dập, căng thẳng từng giây phút." },
  { name: "Tragedy", description: "Bi kịch, cảm động, mất mát sâu sắc để lại dư âm nghẹn ngào." },
];

export default async function seedGenres(imagePool = []) {
  console.log("🏷️ Đang seeding danh mục thể loại (Genres)...");

  const seededGenres = [];

  for (const item of GENRES_LIST) {
    let existingGenre = await db.genre.findUnique({
      where: { name: item.name },
    });

    if (!existingGenre) {
      const thumbnailId = imagePool.length > 0 ? getRandomItem(imagePool) : null;
      existingGenre = await db.genre.create({
        data: {
          name: item.name,
          description: item.description,
          thumbnail_id: thumbnailId,
        },
      });
      console.log(`  + Đã tạo thể loại: ${item.name}`);
    }

    seededGenres.push(existingGenre);
  }

  console.log(`✅ Hoàn thành seeding ${seededGenres.length} thể loại`);
  return seededGenres;
}
