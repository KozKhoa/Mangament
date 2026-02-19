import db from "../../src/configs/db.js";
import { execSync } from "child_process";

export default async function main() {
  execSync(
    `psql "${process.env.DIRECT_URL}" -c "\\copy \\"Story\\"(id,title,view,star,rating_count,type,status,next_chapter_in,number_of_children,cover_art_id,is_deleted,is_actived,poster_id,created_at,updated_at,summary,nation_id) FROM 'prisma/seeds/csv/stories.csv' CSV HEADER"`,
    {
      stdio: "inherit",
    },
  );

  console.log("Seeded stories from CSV");
}
