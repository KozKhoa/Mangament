import { execSync } from "child_process";

export default async function main() {
  execSync(
    `psql "${process.env.DIRECT_URL}" -c "\\copy \\"StoryNode\\"(id,story_id,parent_id,title,type,order_index,view,number_of_children,updated_at,created_at,plain_text,search_vector,is_deleted,poster_id) FROM 'prisma/seeds/csv/story-nodes.csv' CSV HEADER"`,
    { stdio: "inherit" },
  );

  console.log("Seeded Story Node from CSV");
}
