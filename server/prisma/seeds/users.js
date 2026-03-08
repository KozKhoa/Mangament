import db from "../../src/configs/db.js";
import { HashPassword } from "../../src/utils/PasswordHandle.js";

const AVATAR_ID = "001139d8-972f-4863-9609-154be6d4f120";

export default async function main() {
  await db.user.createMany({
    data: [{ name: "khoa", email: "a@a.a", role: "admin", password: await HashPassword("111111"), avatar_id: AVATAR_ID }],
    skipDuplicates: true,
  });
}
