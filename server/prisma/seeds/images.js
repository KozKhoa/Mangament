import { execSync } from "child_process";
import db from "../../src/configs/db.js";

export default async function main() {
  // await db.image.createMany({ data: [{ url: "https://pub-626aeddeabe146fb92f0e8ca1377235a.r2.dev/user/avatar/avatar.png", key: "user/avatar/avatar.png" }] });

  execSync(`psql "${process.env.DIRECT_URL}" -c "\\copy \\"Image\\"(id,url,width,height,is_deleted,public_id) FROM 'prisma/seeds/csv/images.csv' CSV HEADER"`, {
    stdio: "inherit",
  });

  console.log("Seeded images from CSV");
}
