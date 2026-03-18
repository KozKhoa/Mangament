import { execSync } from "child_process";
import db, { StoryStatus, StoryType } from "../../src/configs/db.js";

export default async function main() {
  execSync(
    `psql "${process.env.DIRECT_URL}" -c "\\copy \\"StoryNode\\"(id,story_id,parent_id,title,type,order_index,view,number_of_children,updated_at,created_at,plain_text,search_vector,is_deleted,poster_id) FROM 'prisma/seeds/csv/story-nodes.csv' CSV HEADER"`,
    { stdio: "inherit" },
  );

  const storyStatus = Object.values(StoryStatus);
  const storyType = Object.values(StoryType);

  await db.story.createMany({
    data: Array.from({ length: 1000 }).map((_, i) => ({
      title: crypto.randomUUID(),
      status: storyStatus[i % storyStatus.length] ?? "ongoing",
      type: storyType[i % storyType.length],
    })),
  });

  console.log("Seeded Story Node from CSV");
}
