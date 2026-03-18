import db from "../../src/configs/db.js";
import { HashPassword } from "../../src/utils/PasswordHandle.js";

const AVATAR_ID = "001139d8-972f-4863-9609-154be6d4f120";

export default async function main() {
  const avatar = await db.image.findUnique({ where: { key: "user/avatar/avatar.png" } });

  const hashedPassword = await HashPassword("111111");

  const admin = { name: "khoa", email: "a@a.a", role: "admin", password: hashedPassword, avatar_id: avatar.id };

  await db.user.createMany({
    data: [
      admin,
      ...Array.from({ length: 1000 }).map((_, i) => ({
        name: `user_${i}`,
        email: `user_${i}@gmail.com`,
        password: hashedPassword,
        role: i % 12 === 0 ? "admin" : "user",
        avatar_id: avatar.id,
      })),
    ],
    skipDuplicates: true,
  });
}
