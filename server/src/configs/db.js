import { PrismaClient, Role, Gender, Genre, StoryStatus, StoryType, StoryNodeType } from "../generated/prisma/client.js";

const db = new PrismaClient();

export { Role };
export { Gender };
export { Genre };
export { StoryStatus };
export { StoryType };
export { StoryNodeType };

async function main() {
  await db.$connect();
  console.log("Connected database successfully");
  await db.$disconnect();
}

main().catch((e) => {
  console.error("Database connection failed:", e);
});

export default db;
