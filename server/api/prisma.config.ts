import path from "path";
import dotenv from "dotenv";
import { defineConfig, env } from "prisma/config";

const envFile = process.env.NODE_ENV === "development" ? ".env.local" : ".env";

dotenv.config({
  path: path.resolve(process.cwd(), envFile)
});

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
