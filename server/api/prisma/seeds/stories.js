import db from "../../configs/db.js";

import { StoryStatus, StoryType } from "../../configs/db.js";

import { execSync } from "child_process";

import { faker } from "@faker-js/faker";
import { randomBytes, randomInt } from "crypto";

import storyQueue from "../../queues/story.queue.js";

export default async function main() {
  // execSync(
  //   `psql "${process.env.DIRECT_URL}" -c "\\copy \\"Story\\"(id,title,view,star,rating_count,type,status,next_chapter_in,number_of_children,cover_art_id,is_deleted,is_actived,poster_id,created_at,updated_at,summary,nation_id) FROM 'prisma/seeds/csv/stories.csv' CSV HEADER"`,
  //   {
  //     stdio: "inherit",
  //   },

  // const nations = await db.nation.findMany();

  // const storyStatus = Object.values(StoryStatus);
  // const storyType = Object.values(StoryType);

  // const images = await db.image.findMany();

  // const yesterday = new Date();
  // yesterday.setDate(yesterday.getDate() - 1);

  // await db.story.createMany({
  //   data: Array.from({ length: 111 }).map((_, i) => ({
  //     title: faker.book.title(),
  //     type: storyType[randomInt(storyType.length) % storyType.length],
  //     status: storyStatus[randomInt(storyStatus.length) % storyStatus.length],
  //     star: randomInt(5) + randomInt(10) / 10,
  //     view: randomInt(1000000),
  //     cover_art_id: images[randomInt(images.length) % images.length].id,
  //     nation_id: nations[randomInt(nations.length) % nations.length].id,
  //   })),
  //   skipDuplicates: true,
  // });

  const stories = await db.story.findMany();

  for (const story of stories) {
    storyQueue.addJobEmbeddingStory(story.id);
  }

  console.log("Seeded stories");
}
