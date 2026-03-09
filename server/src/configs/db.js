import { PrismaClient, Role, Gender, Genre, StoryStatus, StoryType, StoryNodeType } from "../generated/prisma/client.js";

const globalForPrisma = globalThis;

const db =
  globalForPrisma.prisma ||
  new PrismaClient({
    log: ["error"],
  });

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = db;
}

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

export default db;
