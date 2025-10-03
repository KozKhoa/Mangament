import db from "../configs/db.js";

export const FindAllAuthors = async ({
  where: {},
  orderBy: {},
  take,
  skip,
}) => {
  try {
    const result = await db.author.findMany({
      where: where,
      orderBy: orderBy,
      take,
      skip,
    });
    return { success: true, data: result };
  } catch (error) {
    console.error("❌ [Author.Model.js] Error finding all author:", error);
    return { success: false, error: error.code };
  }
};

export const FindAuthor = async ({ id }) => {
  try {
    const result = await db.author.findUnique({ where: { id: id } });
    return { success: true, data: result };
  } catch (error) {
    console.error("❌ [Author.Model.js] Error finding author:", error);
    return { success: false, error: error.code };
  }
};

export const AddAuthor = async ({ name, ...props }) => {
  try {
    const result = await db.author.create({ data: { name, ...props } });
    return { success: true, data: result };
  } catch (error) {
    console.error("❌ [Author.Model.js] Error adding author:", error);
    return { success: false, error: error.code };
  }
};

export const HardDeleteAuthor = async ({ id }) => {
  try {
    const result = await db.author.delete({ where: { id: id } });
    return { success: true, data: result };
  } catch (error) {
    console.error("❌ [Author.Model.js] Error hard delete author:", error);
    return { success: false, error: error.code };
  }
};

export const UpdateAuthor = async ({ id, data = {} }) => {
  try {
    const result = await db.author.update({ where: { id: id }, data: data });
    return { success: true, data: result };
  } catch (error) {
    console.error("❌ [Author.Model.js] Error updating author:", error);
    return { success: false, error: error.code };
  }
};
