import db from "../configs/db.js";

export const FindAllUser = async () => {
  try {
    const result = await db.user.findMany();
    return { success: true, data: result };
  } catch (error) {
    console.error("❌ [User.Model.js] Error finding user:", error);
    return { success: false, error: error.code };
  }
};

export const FindUser = async ({ id, email }) => {
  try {
    if (!id && !email) return { success: false, data: null };
    const result = await db.user.findFirst({
      where: {
        is_deleted: false,
        ...(id && { id }),
        ...(email && { email }),
      },
    });
    return { success: true, data: result };
  } catch (error) {
    console.error("❌ [User.Model.js] Error finding user:", error);
    return { success: false, error: error.code };
  }
};

export const AddUser = async ({ name, email, password, ...props }) => {
  try {
    const result = await db.user.create({
      data: { name, email, password, ...props },
    });
    return { success: true, data: result };
  } catch (error) {
    console.error("❌ [User.Model.js] Error adding user: ", error);
    return { success: false, error: error.code };
  }
};

export const HardDeleteUser = async ({ id, email }) => {
  try {
    let result;
    if (id) {
      result = await db.user.delete({ where: { id: id } });
    } else if (email) {
      result = await db.user.delete({ where: { email: email } });
    }
    return { success: true, data: result };
  } catch (error) {
    console.error("❌ [User.Model.js] Error hard delete user: ", error);
    return { success: false, error: error.code };
  }
};

export const SoftDeleteUser = async ({ id, email }) => {
  try {
    let result;
    if (id) {
      result = await db.user.update({
        where: { id: id },
        data: { is_deleted: true },
      });
    } else if (email) {
      result = await db.user.update({
        where: { email: email },
        data: { is_deleted: true },
      });
    }
    return { success: true, data: result };
  } catch (error) {
    console.error("❌ [User.Model.js] Error soft delete user: ", error);
    return { success: false, error: error.code };
  }
};

export const UpdateUser = async ({ id, email, data = {} }) => {
  try {
    let result;
    if (id) {
      result = await db.user.update({ where: { id: id }, data: data });
    } else if (email) {
      result = await db.user.update({ where: { email: email }, data: data });
    }
    return { success: true, data: result };
  } catch (error) {
    console.error("❌ [User.Model.js] Error updating user data: ", error);
    return { success: false, error: error.code };
  }
};

export const FindReadingHistory = async ({ id, user_id, ...props }) => {
  try {
    const result = await db.readingHistory.findMany({
      where: { is_deleted: false, id, user_id, ...props },
    });
    return { success: true, data: result };
  } catch (error) {
    console.error("❌ [User.Model.js] Error finding reading history:", error);
    return { success: false, error: error.code };
  }
};

export const AddReadingHistory = async ({
  user_id,
  story_id,
  story_node_id,
  ...props
}) => {
  try {
    const result = await db.readingHistory.create({
      data: {
        user: {
          connect: {
            id: user_id,
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

export const HardDeleteReadingHistory = async ({ id }) => {
  try {
    const result = await db.readingHistory.delete({
      where: { id: id },
    });
    return { success: true, data: result };
  } catch (error) {
    console.error(
      "❌ [User.Model.js] Error hard delete reading history: ",
      error
    );
    return { success: false, error: error.code };
  }
};

export const SoftDeleteReadingHistory = async ({ id }) => {
  try {
    const result = await db.readingHistory.update({
      where: { id: id },
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

export const UpdateReadingHistory = async ({ id, data = {} }) => {
  try {
    const result = await db.readingHistory.update({
      where: { id },
      data: data,
    });
    return { success: true, data: result };
  } catch (error) {
    console.error("❌ [User.Model.js] Error updating reading history: ", error);
    return { success: false, error: error.code };
  }
};

export const FindRefreshToken = async ({ user_id, token }) => {
  try {
    const result = await db.refreshToken.findUnique({
      where: {
        ...(user_id && { user_id }),
        ...(token && { token }),
      },
    });
    return { success: true, data: result };
  } catch (error) {
    console.error("❌ [User.Model.js] Error finding refresh token: ", error);
    return { success: false, error: error.code };
  }
};

export const AddRefreshToken = async ({ user_id, token }) => {
  try {
    const result = await db.refreshToken.create({
      data: {
        user: {
          connect: {
            id: user_id,
          },
        },
        token: token,
      },
    });
    return { success: true, data: result };
  } catch (error) {
    console.error("❌ [User.Model.js] Error adding refresh token: ", error);
    return { success: false, error: error.code };
  }
};

export const HardDeleteRefreshToken = async ({ user_id, token }) => {
  try {
    const result = await db.refreshToken.delete({
      where: {
        ...(user_id && {
          user: {
            connect: {
              id: user_id,
            },
          },
        }),
        ...(token && { token }),
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
