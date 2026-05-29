import "dotenv/config";
import { defineConfig, env } from "prisma/config";

export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: {
    path: "prisma/migrations",
    seed: "node prisma/seeds/index.js",
  },
  datasource: {
    // url: env("DIRECT_URL"), // Uncommennt if you wanna migrate
    url: env("DATABASE_URL"),
  },
});
