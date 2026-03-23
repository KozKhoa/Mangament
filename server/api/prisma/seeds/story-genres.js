import { execSync } from "child_process";
import db, { Genre } from "../../src/configs/db.js";
import { randomInt } from "crypto";

export default async function main() {
  // execSync(`psql "${process.env.DIRECT_URL}" -c "\\copy \\"Story_Genre\\"(story_id,genre) FROM 'prisma/seeds/csv/story-genres.csv' CSV HEADER"`, {
  //   stdio: "inherit",
  // });
  // console.log("Seeded Story Genres from CSV");

  await db.story_Genre.deleteMany();

  const stories = await db.story.findMany();

  const genres = Object.values(Genre);

  await db.story_Genre.deleteMany({ where: { genre: { in: genres } } });

  await db.story_Genre.createMany({
    data: Array.from({ length: 600 }).map((_, i) => ({
      story_id: stories[randomInt(stories.length) % stories.length].id,
      genre: genres[randomInt(genres.length) % genres.length],
    })),
    skipDuplicates: true,
  });

  console.log("Seeded Story Genres");
}
