import { execSync } from "child_process";

export default async function main() {
  execSync(
    `psql "${process.env.DIRECT_URL}" -c "\\copy \\"StoryNodeContent\\"(id,story_node_id,type,order_index,content,image_id) FROM 'prisma/seeds/csv/story-node-contents.csv' CSV HEADER"`,
    {
      stdio: "inherit",
    },
  );

  console.log("Seeded Story Node Content from CSV");
}
