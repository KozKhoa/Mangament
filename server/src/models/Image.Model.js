import db from "../configs/db.js";

export const FindImage = async ({ id, url }) => {
  const result = await db.image.findFirst({
    where: {
      is_deleted: false,
      id,
      url,
    },
  });
  return { success: true, data: result };
};

export const AddImage = async ({ url, key, public_id }) => {
  const addImage = await db.image.create({ data: { url, public_id, key } }).catch(async (error) => {
    return { success: true, data: await db.image.findUnique({ where: { url: url } }) };
  });

  return { success: true, data: addImage };
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
