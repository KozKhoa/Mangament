import db from "../../configs/db.js";

import { randomInt } from "crypto";

export default async function main() {
  console.log("Seeding story genres");

  await db.story_Genre.deleteMany();

  const genres = await db.genre.findMany();

  const stories = await db.story.findMany();

  await db.story_Genre.createMany({
    data: Array.from({ length: 600 }).map((_, i) => ({
      story_id: stories[randomInt(stories.length) % stories.length].id,
      genre_id: genres[randomInt(genres.length) % genres.length].id,
    })),
    skipDuplicates: true,
  });

  console.log("Seeded story genres successfully");
}
