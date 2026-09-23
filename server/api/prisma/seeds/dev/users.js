import db from "../../../configs/db.js";
import { HashPassword } from "../../../src/utils/Password.js";
import { getRandomItem } from "./utils.js";

const DEFAULT_PASSWORD = "111111";

export default async function seedUsers(imagePool = [], nations = []) {
  console.log("👥 Đang seeding tài khoản người dùng (Dev Users)...");

  const hashedPassword = await HashPassword(DEFAULT_PASSWORD);

  const devUserTemplates = [
    { name: "Quản trị viên", email: "admin@gmail.com", role: "admin", gender: "other" },
    { name: "Nguyễn Văn An", email: "user1@gmail.com", role: "user", gender: "male" },
    { name: "Trần Thị Bình", email: "user2@gmail.com", role: "user", gender: "female" },
    { name: "Lê Hoàng Cường", email: "user3@gmail.com", role: "user", gender: "male" },
    { name: "Phạm Minh Dung", email: "user4@gmail.com", role: "user", gender: "female" },
    { name: "Vũ Tuấn Em", email: "user5@gmail.com", role: "user", gender: "male" },
    { name: "Đỗ Ngọc Hân", email: "user6@gmail.com", role: "user", gender: "female" },
    { name: "Bùi Quốc Khánh", email: "user7@gmail.com", role: "user", gender: "male" },
    { name: "Đinh Thuỳ Linh", email: "user8@gmail.com", role: "user", gender: "female" },
    { name: "Ngô Quang Minh", email: "user9@gmail.com", role: "user", gender: "male" },
    { name: "Hồ Phương Nga", email: "user10@gmail.com", role: "user", gender: "female" },
  ];

  const seededUsers = [];

  for (const template of devUserTemplates) {
    let existingUser = await db.user.findUnique({
      where: { email: template.email },
      include: { accounts: true },
    });

    if (!existingUser) {
      const avatarId = imagePool.length > 0 ? getRandomItem(imagePool) : null;
      const nationId = nations.length > 0 ? getRandomItem(nations)?.id : null;

      existingUser = await db.user.create({
        data: {
          name: template.name,
          email: template.email,
          role: template.role,
          gender: template.gender,
          avatar_id: avatarId,
          nation_id: nationId,
          accounts: {
            create: {
              provider: "email",
              provider_account_id: template.email,
              password: hashedPassword,
            },
          },
        },
      });
      console.log(`  + Đã tạo tài khoản: ${template.email} (${template.role})`);
    } else {
      console.log(`  * Đã tồn tại tài khoản: ${template.email}`);
    }

    seededUsers.push(existingUser);
  }

  console.log(`✅ Hoàn thành seeding ${seededUsers.length} tài khoản người dùng`);
  return seededUsers;
}
