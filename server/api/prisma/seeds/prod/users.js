import db from "../../../configs/db.js";
import { HashPassword } from "../../../src/utils/Password.js";

export default async function main() {
  const hashedPassword = await HashPassword("111111");

  const admin = { name: "admin", email: "admin@gmail.com", role: "admin", password: hashedPassword };

  const adminExists = await db.user.findUnique({ where: { email: admin.email } });

  if (adminExists) {
    console.log("Admin user already exists, skipping seeding");
    return;
  }

  await db.user.create({
    data: {
      name: admin.name,
      email: admin.email,
      role: admin.role,
      accounts: {
        create: {
          provider: "email",
          provider_account_id: admin.email,
          password: admin.password,
        },
      },
    },
  });

  console.log("Admin user created successfully");
}
