import { PrismaClient, Role, Gender, Genre, StoryStatus, StoryType, StoryNodeType } from "../generated/prisma/client.js";

const db = new PrismaClient();

export { Role };
export { Gender };
export { Genre };
export { StoryStatus };
export { StoryType };
export { StoryNodeType };

export default db;
