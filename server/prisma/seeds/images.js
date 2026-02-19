import { execSync } from "child_process";

export default async function main() {
  execSync(`psql "${process.env.DIRECT_URL}" -c "\\copy \\"Image\\"(id,url,width,height,is_deleted,public_id) FROM 'prisma/seeds/csv/images.csv' CSV HEADER"`, {
    stdio: "inherit",
  });

  console.log("Seeded images from CSV");
}
