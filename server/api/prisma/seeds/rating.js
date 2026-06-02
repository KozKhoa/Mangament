import db from "../../configs/db.js";

import { randomInt } from "crypto";

import { faker } from "@faker-js/faker";

export default async function main() {
  const users = await db.user.findMany();
  const stories = await db.story.findMany();

  console.log("Start seeding ratings");

  const ratingsCount = 500;
  const data = [];
  const seen = new Set();

  for (let i = 0; i < ratingsCount; i++) {
    const user = users[randomInt(users.length)];
    const story = stories[randomInt(stories.length)];
    const key = `${user.id}-${story.id}`;

    if (seen.has(key)) continue;
    seen.add(key);

    data.push({
      user_id: user.id,
      story_id: story.id,
      star: randomInt(1, 6), // 1 to 5
      title: `Review for ${story.title}`,
      content: `This is a randomly generated review content for ${story.title}. It was written by ${user.name}. ${faker.lorem.paragraphs()}`,
    });
  }

  await db.rating.createMany({
    data,
    skipDuplicates: true,
  });

  console.log("Seeded ratings");
}
