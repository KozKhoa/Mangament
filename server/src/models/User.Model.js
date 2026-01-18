import db from "../configs/db.js";
import { RandomPassword } from "../utils/PasswordHandle.js";
import { GetParentStoryNodeTree } from "./StoryNode.Model.js";

import * as passwordService from "../utils/PasswordHandle.js";

const IsUserExist = async (where = { id, email }) => {
  if (!where.id && !where.email) return false;

  const story = await FindUser(where);
  if (story && story.success && story.data) return true;
  return false;
};

export async function FindAllUser({ gender = [], joinDate, role = [], birthday, page = 1, limit = 10, sort = { updated_at: "desc" } }) {
  const where = {
    is_deleted: false,

    ...(role && role.length > 0 && { role: { in: role } }),
    ...(birthday && { birthday: birthday }),
    ...(joinDate && { join_date: joinDate }),
    ...(gender && gender.length > 0 && { gender: { in: gender } }),
  };

  const users = await db.user.findMany({
    where: where,

    select: {
      id: true,
      name: true,
      email: true,
      gender: true,
      birthday: true,
      join_date: true,
      role: true,
      avatar: { select: { url: true, width: true, height: true } },
    },

    take: limit,
    skip: (page - 1) * limit,

    orderBy: [sort, { id: "asc" }],
  });

  const totalItems = await db.user.count({ where: where });

  return {
    success: true,
    data: users,
    pagination: {
      page: page,
      pageSize: limit,
      totalPages: Math.ceil(totalItems / limit),
      totalItems: totalItems,
    },
  };
}

export async function FindUser({ id, email }) {
  if (!id && !email) throw new Error("Require 'id' or 'email'");

  const user = await db.user.findFirst({
    where: {
      is_deleted: false,
      ...(id && { id: id }),
      ...(email && { email: email }),
    },

    select: {
      id: true,
      name: true,
      email: true,
      gender: true,
      birthday: true,
      join_date: true,
      role: true,
      avatar: { select: { url: true, width: true, height: true } },
    },
  });

  return { success: true, data: user };
}

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

export async function AddUser({ name, email, password, avatarUrl }) {
  if (!name || !email || !password) throw new Error("Require 'name', 'email' and 'password'");

  const hashedPassword = await passwordService.HashPassword(password);

  const exist = await db.user.findUnique({ where: { email: email } });
  if (exist) throw new Error("User already exist");

  const user = await db.user.create({
    data: {
      name: name,
      email: email,
      password: hashedPassword,

      ...(avatarUrl && {
        avatar: {
          connectOrCreate: {
            where: { url: avatarUrl },
            create: { url: avatarUrl },
          },
        },
      }),
    },

    select: {
      id: true,
      name: true,
      email: true,
      gender: true,
      birthday: true,
      join_date: true,
      role: true,
      avatar: { select: { url: true, width: true, height: true } },
    },
  });

  return { success: true, data: user };
}

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

export async function ChangePassword({ userId, email, newPassword }) {
  if (!email && !userId) return { success: false, message: "Missing field" };

  const user = await db.user.findUnique({ where: { is_deleted: false, ...(userId && { id: userId }), ...(email && { email: email }) } });

  if (!user) return { success: false, message: "User not found" };

  const updateUser = await db.user.update({ where: { id: user.id }, data: { password: newPassword } });

  return { success: !!updateUser, data: updateUser };
}

export async function ResetPassword({ userId }) {
  const user = await db.user.findUnique({ where: { id: userId, is_deleted: false } });
  if (!user) return { success: false, message: "User not found" };

  const newPassword = RandomPassword(12);

  const resetPassword = await db.user.update({ where: { id: userId }, data: { password: newPassword } });

  return { success: true, data: resetPassword };
}
