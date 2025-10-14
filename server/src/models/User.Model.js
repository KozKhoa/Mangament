import db from "../configs/db.js";
import { GetParentStoryNodeTree } from "./Story.Model.js";

const IsUserExist = async (where = { id, email }) => {
  if (!where.id && !where.email) return false;

  const story = await FindUser(where);
  if (story && story.success && story.data) return true;
  return false;
};

export const FindAllUser = async (where = {}, orderBy = {}, take, skip) => {
  try {
    const result = await db.user.findMany({
      where: {
        is_deleted: false,
        ...where,
      },
      orderBy: orderBy,
      take: take,
      skip: skip,
      select: {
        id: true,
        name: true,
        email: true,
        gender: true,
        join_date: true,
        role: true,
        avatar: {
          select: { url: true, width: true, height: true },
        },
      },
    });
    return { success: true, data: result };
  } catch (error) {
    console.error("❌ [User.Model.js] Error finding user:", error);
    return { success: false, error: error.code };
  }
};

export const FindUser = async (where = { id, email }) => {
  try {
    if (!where.id && !where.email) return { success: false, data: null };
    const result = await db.user.findFirst({
      where: {
        is_deleted: false,
        ...where,
      },
    });
    return { success: true, data: result };
  } catch (error) {
    console.error("❌ [User.Model.js] Error finding user:", error);
    return { success: false, error: error.code };
  }
};

export const AddUser = async (data = { name, email, password }) => {
  try {
    const story = await FindUser({ email: data.email });
    if (story && story.success && story.data) {
      // If user exist
      return { success: false, data: story.data };
    }
    // If not exist
    const result = await db.user.create({ data: data });
    return { success: true, data: result };
  } catch (error) {
    console.error("❌ [User.Model.js] Error adding user: ", error);
    return { success: false, error: error.code };
  }
};

export const HardDeleteUser = async (where = { id, email }) => {
  try {
    const result = await db.user.delete({ where: where });
    return { success: true, data: result };
  } catch (error) {
    console.error("❌ [User.Model.js] Error hard delete user: ", error);
    return { success: false, error: error.code };
  }
};

export const SoftDeleteUser = async (where = { id, email }) => {
  try {
    const user = await FindUser(where);
    if (!user || !user.success || !user.data) {
      // If user does not exist
      return { success: false, data: null };
    }
    // If user exist
    const result = await db.user.update({
      where: where,
      data: {
        is_deleted: true,
      },
    });

    return { success: true, data: result };
  } catch (error) {
    console.error("❌ [User.Model.js] Error soft delete user: ", error);
    return { success: false, error: error.code };
  }
};

export const UpdateUser = async (where = { id, email }, data = {}) => {
  try {
    if (IsUserExist(where) === false) return { success: false, data: null };

    const update = await db.user.update({ where: where, data: data });
    const result = {
      ...update,
      ...{ password: "" },
    };
    return { success: true, data: result };
  } catch (error) {
    console.error("❌ [User.Model.js] Error updating user data: ", error);
    return { success: false, error: error.code };
  }
};

export const FindRefreshToken = async (where = { user_id, token }) => {
  try {
    const result = await db.refreshToken.findUnique({
      where: {
        ...(where.user_id && { user_id: where.user_id }),
        ...(where.token && { token: where.token }),
      },
    });
    return { success: true, data: result };
  } catch (error) {
    console.error("❌ [User.Model.js] Error finding refresh token: ", error);
    return { success: false, error: error.code };
  }
};

export const AddRefreshToken = async (where = { user_id, token }) => {
  try {
    const result = await db.refreshToken.create({
      data: {
        user: {
          connect: {
            id: where.user_id,
          },
        },
        ...(where.token && { token: where.token }),
      },
    });
    return { success: true, data: result };
  } catch (error) {
    console.error("❌ [User.Model.js] Error adding refresh token: ", error);
    return { success: false, error: error.code };
  }
};

export const HardDeleteRefreshToken = async (where = { user_id, token }) => {
  try {
    const result = await db.refreshToken.delete({
      where: {
        ...(where.user_id && {
          user: {
            connect: {
              id: user_id,
            },
          },
        }),
        ...(where.token && { token: where.token }),
      },
    });
    return { success: true, data: result };
  } catch (error) {
    console.error(
      "❌ [User.Model.js] Error hard delete refresh token: ",
      error
    );
    return { success: false, error: error.code };
  }
};

export const FindReadingHistory = async (
  where = { id, user_id, story_id, story_node_id },
  take = 1,
  skip = 0,
  orderyBy
) => {
  try {
    const readingHistory = await db.readingHistory.findMany({
      where: { is_deleted: false, ...where },
      take: take,
      skip: skip,
      ...(orderyBy
        ? { orderBy: orderyBy }
        : { orderBy: { create_at: "desc" } }),
      select: {
        id: true,
        user_id: true,
        story_node_id: true,
        create_at: true,
        story: {
          select: {
            id: true,
            title: true,
            type: true,
            cover_art: {
              select: { url: true, width: true, height: true },
            },
          },
        },
      },
    });

    for (const history of readingHistory) {
      history.story_node = await GetParentStoryNodeTree(history.story_node_id);
    }

    return { success: true, data: readingHistory };
  } catch (error) {
    console.error("❌ [User.Model.js] Error finding reading history:", error);
    return { success: false, error: error.code };
  }
};

export const AddReadingHistory = async (
  data = {
    user_id,
    story_id,
    story_node_id,
    ...props,
  }
) => {
  try {
    const result = await db.readingHistory.create({
      data: {
        user: {
          connect: {
            id: data.user_id,
          },
        },
        story: {
          connect: {
            id: story_id,
          },
        },
        story_node: {
          connect: {
            id: story_node_id,
          },
        },
        ...props,
      },
    });
    return { success: true, data: result };
  } catch (error) {
    console.error("❌ [User.Model.js] Error adding reading history:", error);
    return { success: false, error: error.code };
  }
};

export const HardDeleteReadingHistory = async (where = { id }) => {
  try {
    const result = await db.readingHistory.delete({ where: where });
    return { success: true, data: result };
  } catch (error) {
    console.error(
      "❌ [User.Model.js] Error hard delete reading history: ",
      error
    );
    return { success: false, error: error.code };
  }
};

export const SoftDeleteReadingHistory = async (where = { id }) => {
  try {
    const readingHistory = await FindReadingHistory({ id: where.id });
    if (!readingHistory || !readingHistory.success || !readingHistory.data) {
      return { success: false, data: null };
    }

    const result = await db.readingHistory.update({
      where: where,
      data: { is_deleted: true },
    });
    return { success: true, data: result };
  } catch (error) {
    console.error(
      "❌ [User.Model.js] Error soft delete reading history: ",
      error
    );
    return { success: false, error: error.code };
  }
};

export const UpdateReadingHistory = async (where = { id }, data = {}) => {
  try {
    const readingHistory = await FindReadingHistory({ id: where.id });
    if (!readingHistory || !readingHistory.success || !readingHistory.data) {
      return { success: false, data: null };
    }

    const result = await db.readingHistory.update({
      where: where,
      data: data,
    });
    return { success: true, data: result };
  } catch (error) {
    console.error("❌ [User.Model.js] Error updating reading history: ", error);
    return { success: false, error: error.code };
  }
};
