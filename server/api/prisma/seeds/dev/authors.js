import db from "../../../configs/db.js";
import { getRandomItem } from "./utils.js";

const AUTHORS_LIST = [
  { name: "Eiichiro Oda" },
  { name: "Hajime Isayama" },
  { name: "Akira Toriyama" },
  { name: "ONE" },
  { name: "Yusuke Murata" },
  { name: "Kentaro Miura" },
  { name: "Tite Kubo" },
  { name: "Gege Akutami" },
  { name: "Tatsuki Fujimoto" },
  { name: "Makoto Shinkai" },
  { name: "Kugane Maruyama" },
  { name: "Tappei Nagatsuki" },
  { name: "Rifujin na Magonote" },
  { name: "NisiOisiN" },
  { name: "Hirohiko Araki" },
];

export default async function seedAuthors(imagePool = [], nations = []) {
  console.log("✍️ Đang seeding danh sách tác giả (Authors)...");

  const seededAuthors = [];
  const japanNation = nations.find((n) => n.name.toLowerCase().includes("japan") || n.name.toLowerCase().includes("nhật")) || nations[0];

  for (const author of AUTHORS_LIST) {
    let existingAuthor = await db.author.findFirst({
      where: { name: author.name },
    });

    if (!existingAuthor) {
      const avatarId = imagePool.length > 0 ? getRandomItem(imagePool) : null;
      existingAuthor = await db.author.create({
        data: {
          name: author.name,
          avatar_id: avatarId,
          nation_id: japanNation?.id || null,
        },
      });
      console.log(`  + Đã tạo tác giả: ${author.name}`);
    } else {
      console.log(`  * Đã tồn tại tác giả: ${author.name}`);
    }

    seededAuthors.push(existingAuthor);
  }

  console.log(`✅ Hoàn thành seeding ${seededAuthors.length} tác giả`);
  return seededAuthors;
}
