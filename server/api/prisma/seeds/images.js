import db from "../../configs/db.js";

export default async function main() {
  // Create avatar default image

  const defaultAvatarKey = process.env.DEFAULT_AVATAR_IAMGE_KEY;
  const defaultAvatarUrl = process.env.DEFAULT_AVATAR_IAMGE_URL;

  if (!defaultAvatarKey || !defaultAvatarUrl) {
    console.log(
      "Default avatar image key or url is not defined in environment variables"
    );
    return;
  }

  await db.image
    .create({
      data: {
        key: defaultAvatarKey,
        url: defaultAvatarUrl,
      },
    })
    .catch((error) => {
      if (error.code === "P2002") {
        console.log("Default avatar image already exists, skipping seeding");
        return;
      }
      console.log(error);
    });

  console.log("Seeded images successfully");
}
