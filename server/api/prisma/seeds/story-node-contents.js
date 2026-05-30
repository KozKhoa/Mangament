import db from "../../configs/db.js";

import { randomInt } from "crypto";

import { faker } from "@faker-js/faker";
import { StoryNodeContentType } from "../../configs/db.js";

export default async function main() {
  // execSync(
  //   `psql "${process.env.DIRECT_URL}" -c "\\copy \\"StoryNodeContent\\"(id,story_node_id,type,order_index,content,image_id) FROM 'prisma/seeds/csv/story-node-contents.csv' CSV HEADER"`,
  //   {
  //     stdio: "inherit",
  //   },
  // );

  const storyNodeContentType = Object.values(StoryNodeContentType);

  const storyNodes = await db.storyNode.findMany({ include: { story: true } });

  const images = await db.image.findMany();

  for (const node of storyNodes) {
    const storyNodeContents = await db.storyNodeContent.createMany({
      data: Array.from({ length: randomInt(100) }).map((_, i) => {
        if (node.story.type === "light_novel") {
          const type = storyNodeContentType[randomInt(storyNodeContentType.length) % storyNodeContentType.length];

          return {
            story_node_id: node.id,
            type,
            order_index: i,
            content: type === "text" ? faker.lorem.paragraph() : null,
            image_id: type === "image" ? images[randomInt(images.length) % images.length].id : null,
          };
        } else if (node.story.type === "manga") {
          return {
            story_node_id: node.id,
            type: "image",
            order_index: i,
            image_id: images[randomInt(images.length) % images.length].id,
          };
        }

        return null;
      }),
      skipDuplicates: true,
    });

    console.log(storyNodeContents);
  }

  // await db.storyNodeContent.createMany({
  //   data: Array.from({ length: 1000 }).map((_, i) => {
  //     const storyNode = storyNodes[randomInt(storyNodes.length) % storyNodes.length];
  //     const story = storyNode.story;

  //     if (story.type === "light_novel") {
  //       return {
  //         story_node_id: storyNode.id,
  //         type: "text",
  //         order_index: i,
  //         content: faker.lorem.paragraph(),
  //       };
  //     } else if (story.type === "manga") {
  //       return {
  //         story_node_id: storyNode.id,
  //         type: "image",
  //         order_index: i,
  //         image_id: images[randomInt(images.length) % images.length].id,
  //       };
  //     }

  //     return null;
  //   }),
  //   skipDuplicates: true,
  // });

  console.log("Seeded Story Node Content from CSV");
}
