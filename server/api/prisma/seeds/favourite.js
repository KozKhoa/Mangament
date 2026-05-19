import db from "../../configs/db.js";

import { randomInt } from "crypto";

export default async function main() {
  const users = await db.user.findMany();
  const stories = await db.story.findMany();

  await db.favouriteStory.createMany({
    data: Array.from({ length: 1000 }).map((_, i) => ({
      user_id: users[randomInt(users.length) % users.length].id,
      story_id: stories[randomInt(stories.length) % stories.length].id,
    })),
    skipDuplicates: true,
  });

  console.log("Seeded favourite");
}
