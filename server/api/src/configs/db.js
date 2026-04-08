import "dotenv/config";
import pg from "pg";
import { PrismaPg } from "@prisma/adapter-pg";

import { PrismaClient, Role, Gender, Genre, StoryStatus, StoryType, StoryNodeType, StoryNodeContentType } from "../generated/prisma/client.js";

const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new PrismaPg(pool);

const globalForPrisma = globalThis;

const db = new PrismaClient({
  adapter: adapter,
});

// const db =
//   globalForPrisma.prisma ||
//   new PrismaClient({
//     adapter: adapter,
//   });

// if (process.env.NODE_ENV !== "production") {
//   globalForPrisma.prisma = db;
// }

try {
  await db.$queryRaw`SELECT 1`;
  console.log("Database ready");
} catch (e) {
  console.error("Database connection failed", e);
}

export { Role };
export { Gender };
export { Genre };
export { StoryStatus };
export { StoryType };
export { StoryNodeType };
export { StoryNodeContentType };
export default db;
