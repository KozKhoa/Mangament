import path from "path";
import dotenv from "dotenv";
import { defineConfig, env } from "prisma/config";

import fs from "fs";

const envFiles = [`.env.${process.env.NODE_ENV}.development`, `.env.${process.env.NODE_ENV}`, ".env.development", ".env.production", ".env"];

for (const file of envFiles) {
  const fullPath = path.resolve(process.cwd(), file);
  if (fs.existsSync(fullPath)) {
    dotenv.config({ path: fullPath });
    break;
  }
}

export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: {
    path: "prisma/migrations",
    seed: "node prisma/seeds/index.js",
  },
  datasource: {
    url: env("DIRECT_URL"), // Uncommennt if you wanna migrate
    // url: env("DATABASE_URL"),
  },
});
