import cloudinary from "../configs/cloudinary.js";

export async function uploadImage(filePath) {
  const result = await cloudinary.uploader.upload(filePath, {
    image_metadata: true,
    folder: "Mangement",
  });

  return result;
}
