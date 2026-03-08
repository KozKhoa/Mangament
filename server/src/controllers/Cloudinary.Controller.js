import * as cloudinaryService from "../services/cloudinary.service.js";

// GET /cloudinary/signature/story/:storyId/cover-art
// GET /cloudinary/signature/storyType/:storyType/storyTitle/:storyTitle/cover-art
export async function CreateSignatureForUploadStoryCoverArt(req, res, next) {
  try {
    const storyId = req.params.storyId;

    const storyTitle = req.params.storyTitle;
    const storyType = req.params.storyType;

    const { timestamp, signature, folder, publicId } = await cloudinaryService.generateSignatureForUploadStoryCoverArt(storyId, storyType, storyTitle);

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

export async function CreateSignatureForUploadStoryNodeContent(req, res, next) {
  try {
    const storyNodeId = req.params.storyNodeId;

    const { timestamp, signature, folder } = await cloudinaryService.generateSignatureForUploadStoryNodeContent(storyNodeId);

    return res.json({
      timestamp,
      signature,
      apiKey: process.env.CLOUDINARY_API_KEY,
      cloudName: process.env.CLOUDINARY_CLOUD_NAME,
      folder: folder,
    });
  } catch (error) {
    next(error);
  }
}
