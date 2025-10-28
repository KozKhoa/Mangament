import db from "../configs/db.js";

export const FindAllAuthors = async (where, orderBy, take = 1, skip = 0) => {
  try {
    const result = await db.author.findMany({
      ...(where && { where: where }),
      ...(orderBy && { orderBy: orderBy }),
      take: take,
      skip: skip,
    });
    return { success: true, data: result };
  } catch (error) {
    console.error("❌ [Author.Model.js] Error finding all author:", error);
    return { success: false, error: error.code };
  }
};

export const FindAuthor = async (where = { id }) => {
  try {
    const result = await db.author.findUnique({ where: where });
    return { success: true, data: result };
  } catch (error) {
    console.error("❌ [Author.Model.js] Error finding author:", error);
    return { success: false, error: error.code };
  }
};

export const AddAuthor = async (data = {}) => {
  try {
    const result = await db.author.create({ data: data });
    return { success: true, data: result };
  } catch (error) {
    console.error("❌ [Author.Model.js] Error adding author:", error);
    return { success: false, error: error.code };
  }
};

export const HardDeleteAuthor = async (where = { id }) => {
  try {
    const result = await db.author.delete({ where: where });
    return { success: true, data: result };
  } catch (error) {
    console.error("❌ [Author.Model.js] Error hard delete author:", error);
    return { success: false, error: error.code };
  }
};

export const UpdateAuthor = async (where = { id }, data = { name }) => {
  try {
    const result = await db.author.update({ where: where, data: data });
    return { success: true, data: result };
  } catch (error) {
    console.error("❌ [Author.Model.js] Error updating author:", error);
    return { success: false, error: error.code };
  }
};
