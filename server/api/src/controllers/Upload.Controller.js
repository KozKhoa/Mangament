import uploadService from "../services/upload.service.js";

// POST /uploads/user/:userId/avatar
// POST /uploads/user/me/avatar
export async function UploadAvatar(req, res, next) {
  try {
    const userId = req.params?.userId ?? req.user.id;

    const file = req.file;

    const avatar = (await uploadService.uploadAvatar(userId, file)).data;

    res.json({ success: true, data: avatar });
  } catch (err) {
    next(err);
  }
}

// POST /uploads/story/images
export async function UploadStoryImages(req, res, next) {
  try {
    const files = req.files;

    const images = (await uploadService.uploadStoryImages(files)).data;

    res.json({ success: true, data: images });
  } catch (err) {
    next(err);
  }
}
