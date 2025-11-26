import { Role, Gender, Genre, StoryStatus, StoryType, StoryNodeType } from "../generated/prisma/client.js";
import { PrismaClient } from "../generated/prisma/client.js";
import { PrismaPg } from "@prisma/adapter-pg";

import { DATABASE_URL } from "./env.js";

const adapter = new PrismaPg({
  connectionString: DATABASE_URL,
});

// console.log(adapter);

const db = new PrismaClient({ adapter });

export { Role };
export { Gender };
export { Genre };
export { StoryStatus };
export { StoryType };
export { StoryNodeType };

export default db;
