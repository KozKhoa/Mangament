import db from "../configs/db.js";

export const FindImage = async ({ id, url }) => {
  try {
    const result = await db.image.findMany({
      where: {
        is_deleted: false,
        ...(id && { id }),
        ...(url && { url }),
      },
    });
    return { success: true, data: result };
  } catch (error) {
    console.error("❌ [Image.Model.js] Error finding image:", error);
    return { success: false, error: error.code };
  }
};

export const AddImage = async ({ url, ...props }) => {
  try {
    const result = await db.image.create({
      data: {
        url: url,
        ...props,
      },
    });
    return { success: true, data: result };
  } catch (error) {
    console.error("❌ [Image.Model.js] Error adding image:", error);
    return { success: false, error: error.code };
  }
};

export const SoftDeleteImage = async ({ id, url }) => {
  try {
    const result = await db.image.update({
      where: {
        ...(id && { id }),
        ...(url && { url }),
      },
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

export const HardDeleteImage = async ({ id, url }) => {
  try {
    const result = await db.image.delete({
      where: {
        ...(id && { id }),
        ...(url && { url }),
      },
    });
    return { success: true, data: result };
  } catch (error) {
    console.error("❌ [Image.Model.js] Error hard delete image:", error);
    return { success: false, error: error.code };
  }
};

export const UpdateImage = async ({ id, url, data = {} }) => {
  try {
    const result = await db.image.update({
      where: {
        ...(id && { id }),
        ...(url && { url }),
      },
      data: data,
    });
    return { success: true, data: result };
  } catch (error) {
    console.error("❌ [User.Model.js] Error updating image: ", error);
    return { success: false, error: error.code };
  }
};
