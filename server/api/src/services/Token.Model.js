import db from "../configs/db.js";

export async function AddRefreshToken({ userId, token }) {
  if (!userId || !token) throw new Error("Require 'userId' and 'token'");

  const result = await db.refreshToken.create({
    data: {
      user: { connect: { id: userId } },
      token: token,
    },
  });
  return { success: true, data: result };
}

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
    return { success: false, error: error.code };
  }
};
