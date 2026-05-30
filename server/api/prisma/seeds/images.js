import db from "../../configs/db.js";

export default async function main() {
  // Create avatar default image
  await db.image
    .create({
      data: {
        key: process.env.DEFAULT_AVATAR_IAMGE_KEY,
        url: process.env.DEFAULT_AVATAR_IAMGE_URL,
      },
    })
    .catch((error) => {
      console.log(error);
    });

  console.log("Seeded images successfully");
}
