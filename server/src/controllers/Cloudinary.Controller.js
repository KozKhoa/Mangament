import * as cloudinaryService from "../services/cloudinary.service.js";

export async function CreateSignatureForUploadStoryCoverArt(req, res, next) {
  try {
    const storyId = req.params.storyId;

    const { timestamp, signature, folder, publicId } = await cloudinaryService.generateSignatureForUploadStoryCoverArt(storyId);

    return res.json({
      timestamp,
      signature,
      publicId,
      apiKey: process.env.CLOUDINARY_API_KEY,
      cloudName: process.env.CLOUDINARY_CLOUD_NAME,
      folder: folder,
    });
  } catch (error) {
    next(error);
  }
}
