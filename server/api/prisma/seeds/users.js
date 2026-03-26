import db from "../../src/configs/db.js";
import { HashPassword } from "../../src/utils/Password.js";

import { faker } from "@faker-js/faker";

export default async function main() {
  const avatar = await db.image.findUnique({ where: { key: "user/avatar/avatar.png" } });

  const hashedPassword = await HashPassword("111111");

  const admin = { name: "khoa", email: "a@a.a", role: "admin", password: hashedPassword, avatar_id: avatar.id };

  await db.user.createMany({
    data: [
      admin,
      ...Array.from({ length: 500 }).map((_, i) => {
        const name = faker.person.lastName() + " " + faker.person.firstName();
        const email = faker.internet.email();

        return {
          name: name,
          email: email,
          password: hashedPassword,
          role: i % 12 === 0 ? "admin" : "user",
          avatar_id: avatar.id,
        };
      }),
    ],
    skipDuplicates: true,
  });
}
