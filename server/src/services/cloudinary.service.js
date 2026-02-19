import cloudinary from "../configs/cloudinary.js";
import { CreateError } from "../utils/ErrorHandle.js";

import * as storiesModel from "../models/Story.Model.js";

export async function uploadImage(filePath) {
  const result = await cloudinary.uploader.upload(filePath, {
    image_metadata: true,
    folder: "Mangement",
  });

  return result;
}

export async function generateSignatureForUploadStoryCoverArt(storyId) {
  if (!storyId) throw CreateError(400, "Require 'storyId' to generate signature");

  const story = (await storiesModel.FindStory({ id: storyId })).data;
  if (!story) throw CreateError(400, "Story not found");

  const timestamp = Math.round(new Date().getTime() / 1000);

  const folder = ["Mangament", story.type, story.title].join("/");
  const publicId = ["stories", story.type, story.title, "cover_art"].join("/");

  const signature = cloudinary.utils.api_sign_request({ timestamp, folder, public_id: publicId }, process.env.CLOUDINARY_API_SECRET);

  return { timestamp, signature, folder, publicId };
}
