import db from "../../configs/db.js";

import { faker } from "@faker-js/faker";

import { randomInt } from "crypto";

export default async function main() {
  console.log("Seeding authors");

  await db.author.deleteMany();

  const authors = await db.author.createManyAndReturn({
    data: Array.from({ length: 1000 }, () => ({
      name: faker.person.fullName(),
    })),
    skipDuplicates: true,
  });

  console.log("Seeding story author");

  const stories = await db.story.findMany();

  for (const story of stories) {
    await db.story_Author.createMany({
      data: Array.from({ length: randomInt(10) }, () => ({
        story_id: story.id,
        author_id: authors[randomInt(authors.length) % authors.length].id,
      })),
      skipDuplicates: true,
    });
  }

  console.log("Seeded authors");
}
