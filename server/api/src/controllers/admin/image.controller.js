import { CreateError } from "../../utils/ErrorHandle.js";

import * as imageService from "../../services/image.service.js";

// GET /admin/images/trash
export async function getAllTrashImages(req, res, next) {
  try {
    const page = Number(req.query?.page ?? 1);
    const limit = Number(req.query?.limit ?? 10);

    const trashImage = await imageService.FindTrashImage({ page, limit });

    res.json({ success: true, data: trashImage.data, pagination: trashImage.pagination });
  } catch (error) {
    next(error);
  }
}

// DELETE /admin/images/trash
export async function deleteManyTrashImages(req, res, next) {
  try {
    const imageIds = req.body?.ids;

    if (!imageIds) throw CreateError(400, "'id' for image is required");

    await imageService.HardDeleteManyImages({ ids: imageIds });

    return res.json({ success: true, message: "Remove successfully" });
  } catch (error) {
    next(error);
  }
}

// DELETE /admin/images/trash/:id
export async function deleteTrashImage(req, res, next) {
  try {
    const imageId = req.params?.id;

    if (!imageId) throw CreateError(400, "'id' for image is required");

    await imageService.HardDeleteImage({ id: imageId });

    return res.json({ success: true, message: "Remove successfully" });
  } catch (error) {
    next(error);
  }
}
