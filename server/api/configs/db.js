import "dotenv-flow/config";
import pg from "pg";
import { PrismaPg } from "@prisma/adapter-pg";

import { PrismaClient, Role, Gender, StoryStatus, StoryType, StoryNodeType, StoryNodeContentType } from "../prisma/generated/prisma/client.js";

const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new PrismaPg(pool);

const globalForPrisma = globalThis;

// const db = new PrismaClient({
//   adapter: adapter,
// });

const db = globalForPrisma.prisma || new PrismaClient({ adapter: adapter });

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = db;
}

export const connectToDatabase = async () => {
  try {
    console.log("▪️▪️▪️Connecting to Database...");
    await db.$queryRaw`SELECT 1`;
    console.log("✅ Database connected");
  } catch (e) {
    console.error("❌ Database connection failed", e);
  }
};

export { Role };
export { Gender };
export { StoryStatus };
export { StoryType };
export { StoryNodeType };
export { StoryNodeContentType };

export default db;
