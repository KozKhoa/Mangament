import db from "../configs/db.js";

export const FindImage = async (where = { id, url }) => {
  try {
    const result = await db.image.findUnique({
      where: {
        is_deleted: false,
        ...where,
      },
    });
    return { success: true, data: result };
  } catch (error) {
    console.error("❌ [Image.Model.js] Error finding image:", error);
    return { success: false, error: error.code };
  }
};

export const AddImage = async (data = { url }) => {
  let image;
  try {
    image = await db.image.create({ data: data });
    return { success: true, data: image };
  } catch (error) {
    if (error.code !== "P2002") console.error("❌ [Image.Model.js] Error adding image:", error);
    return { success: false, error: error, data: image };
  }
};

export const SoftDeleteImage = async (where = { id, url }) => {
  try {
    const image = await FindImage(where);
    if (!image || image.success || image.data) {
      // If not image is not found
      return { success: false, data: null };
    }

    // Image is found
    const result = await db.image.update({
      where: where,
      data: {
        is_deleted: true,
      },
    });
    return { success: true, data: result };
  } catch (error) {
    console.error("❌ [Image.Model.js] Error soft delete image:", error);
    return { success: false, error: error.code };
  }
};

export const HardDeleteImage = async (where = { id, url }) => {
  try {
    const result = await db.image.delete({
      where: where,
    });
    return { success: true, data: result };
  } catch (error) {
    console.error("❌ [Image.Model.js] Error hard delete image:", error);
    return { success: false, error: error.code };
  }
};

export const UpdateImage = async (where = { id, url }, data = {}) => {
  try {
    const image = await FindImage(where);
    if (!image || image.success || image.data) {
      // If not image is not found
      return { success: false, data: null };
    }
    // If image is found
    const result = await db.image.update({
      where: where,
      data: data,
    });
    return { success: true, data: result };
  } catch (error) {
    console.error("❌ [User.Model.js] Error updating image: ", error);
    return { success: false, error: error.code };
  }
};

export async function FindTrashImage({ page = 1, limit = 10 }) {
  const trashImage = await db.image.findMany({
    where: {
      user: { none: {} },
      story: { none: {} },
      nation: { none: {} },
      story_node_content: { none: {} },
    },

    take: limit,
    skip: (page - 1) * limit,
  });

  return { success: true, data: trashImage };
}
