import db from "../configs/db.js";
import { GetParentStoryNodeTree } from "./StoryNode.Model.js";

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
        birthday: true,
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

export const GetUserPassword = async (where = { id }) => {
  try {
    if (!where.id) return { success: false, data: null };
    const password = await db.user.findFirst({
      where: where,
      select: {
        password: true,
      },
    });
    return { success: true, data: password };
  } catch (error) {
    console.error("❌ [User.Model.js] Error getting user password:", error);
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
    // If user does not exist
    if (!user || !user.success || !user.data) {
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
