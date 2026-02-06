import db from "../configs/db.js";
import { RandomPassword } from "../utils/PasswordHandle.js";
import { GetParentStoryNodeTree } from "./StoryNode.Model.js";

import * as passwordService from "../utils/PasswordHandle.js";
import { CreateError } from "../utils/ErrorHandle.js";

export async function FindAllUser({
  genders = [],
  fromDate,
  toDate,
  roles = [],
  birthday,
  page = 1,
  limit = 10,
  sort = { join_date: "desc" },
  isBanned,
  search,
}) {
  const where = {
    is_deleted: false,

    ...(search && { OR: [{ email: { contains: search, mode: "insensitive" } }, { name: { contains: search, mode: "insensitive" } }] }),
    ...(roles && roles.length > 0 && { role: { in: roles } }),
    ...(birthday && { birthday: birthday }),
    ...(genders && genders.length > 0 && { gender: { in: genders } }),
    ...(isBanned !== undefined && { is_banned: isBanned }),

    ...((fromDate || toDate) && {
      join_date: {
        ...(fromDate && { gte: fromDate }),
        ...(toDate && { lt: toDate }),
      },
    }),
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
      is_banned: true,
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
      pageSize: users.length,
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

    include: {
      avatar: { select: { url: true, width: true, height: true } },
    },
  });

  if (!user) throw CreateError(404, "User not found");

  return { success: true, data: user };
}

export async function BannedUser({ id, email, isBanned }) {
  if (!id && !email) throw CreateError(400, "'id' or 'email' is required");
  if (!isBanned && typeof isBanned !== "boolean") throw CreateError(400, "'isBanned' is required");
  if (typeof isBanned !== "boolean") throw CreateError(400, "'isBanned' must be boolean");

  const where = {
    is_deleted: false,

    ...(id && { id: id }),
    ...(email && { email: email }),
  };

  const bannedUser = await db.user.updateMany({ where: where, data: { is_banned: isBanned } });

  if (bannedUser.count === 0) {
    const user = await db.user.findFirst({ where: where });
    if (!user) throw CreateError(404, "User not found");
  }

  return { success: true, data: bannedUser };
}

export async function UpdateUser({ id, email, data }) {
  if (!id && !email) throw CreateError(400, "'id' or 'email' is required");

  const where = {
    is_deleted: false,
    ...(id && { id: id }),
    ...(email && { email: email }),
  };

  return await db.$transaction(async (db) => {
    const user = await db.user.findFirst({ where: where });
    if (!user) throw CreateError(404, "User not found");

    const update = await db.user.update({
      where: where,
      data: data,
      include: { avatar: { select: { url: true, height: true, width: true } } },
    });

    delete update?.password;

    return { success: true, data: update };
  });
}

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

export async function SoftDeleteUser({ id, email }) {
  if (!id && !email) throw CreateError(400, "'id' or 'email' is required");

  const where = {
    ...(id && { id: id }),
    ...(email && { email: email }),
  };

  return await db.$transaction(async (db) => {
    const user = await db.user.findFirst({ where: where });
    if (!user) throw CreateError(404, "User not found");

    const softDelete = await db.user.update({ where: where, data: { is_deleted: true } });

    delete softDelete.password;

    return { success: true, data: softDelete };
  });
}

export async function CountUsers() {
  const count = await db.user.count({ where: { is_deleted: false } });
  return { success: true, data: count };
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

export const HardDeleteUser = async (where = { id, email }) => {
  try {
    const result = await db.user.delete({ where: where });
    return { success: true, data: result };
  } catch (error) {
    console.error("❌ [User.Model.js] Error hard delete user: ", error);
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
