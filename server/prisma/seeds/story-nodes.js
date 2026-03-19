import { execSync } from "child_process";
import db, { StoryNodeType, StoryStatus, StoryType } from "../../src/configs/db.js";
import { randomInt } from "crypto";

export default async function main() {
  // execSync(
  //   `psql "${process.env.DIRECT_URL}" -c "\\copy \\"StoryNode\\"(id,story_id,parent_id,title,type,order_index,view,number_of_children,updated_at,created_at,plain_text,search_vector,is_deleted,poster_id) FROM 'prisma/seeds/csv/story-nodes.csv' CSV HEADER"`,
  //   { stdio: "inherit" },
  // );

  const stories = await db.story.findMany();

  for (const story of stories) {
    if (randomInt(3) % 2 === 0) {
      const storyNodes = await db.storyNode.createManyAndReturn({
        data: Array.from({ length: randomInt(10) }).map((_, i) => ({ story_id: story.id, type: "volume", order_index: i })),
        skipDuplicates: true,
      });

      for (const node of storyNodes) {
        await db.storyNode.createMany({
          data: Array.from({ length: randomInt(50) }).map((_, i) => ({ story_id: story.id, parent_id: node.id, type: "chapter", order_index: i })),
          skipDuplicates: true,
        });
      }

      console.log(storyNodes);
    } else {
      const storyNodes = await db.storyNode.createManyAndReturn({
        data: Array.from({ length: randomInt(120) }).map((_, i) => ({ story_id: story.id, type: "chapter", order_index: i })),
        skipDuplicates: true,
      });

      console.log(storyNodes);
    }
  }

  console.log("Seeded Story Node");
}
