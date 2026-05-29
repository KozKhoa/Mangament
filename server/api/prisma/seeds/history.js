import db from "../../configs/db.js";

import { randomInt } from "crypto";

export default async function main() {
  const users = await db.user.findMany();
  const storyNodes = await db.storyNode.findMany();

  await db.readingHistory.createMany({
    data: Array.from({ length: 1000 }).map(() => {
      const storyNode = storyNodes[randomInt(storyNodes.length) % storyNodes.length];

      const randomDate = new Date();
      randomDate.setDate(randomDate.getDate() - randomInt(30));

      return {
        user_id: users[randomInt(users.length) % users.length].id,
        story_id: storyNode.story_id,
        story_node_id: storyNode.id,
        created_at: randomDate,
      };
    }),
    skipDuplicates: true,
  });

  console.log("Seeded history");
}
