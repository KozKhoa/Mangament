import { execSync } from "child_process";
import db from "../../src/configs/db.js";

export default async function main() {
  // execSync(`psql "${process.env.DIRECT_URL}" -c "\\copy \\"Story_Genre\\"(story_id,genre) FROM 'prisma/seeds/csv/story-genres.csv' CSV HEADER"`, {
  //   stdio: "inherit",
  // });
  // console.log("Seeded Story Genres from CSV");
}
