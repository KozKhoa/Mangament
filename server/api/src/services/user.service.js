import db from "../configs/db.js";
import { RandomPassword } from "../utils/Password.js";
import { GetParentStoryNodeTree } from "./story-node.service.js";

import * as passwordService from "../utils/Password.js";
import { CreateError } from "../utils/ErrorHandle.js";
import { redis } from "../configs/redis.js";
import { throwErrorIfInvalidGenders } from "../utils/Validators.js";
import redisUtils from "../utils/Redis.js";

const REDIS_TTL = 60 * 30; // 30 minutes

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
  const version = await redisUtils.users().get();

  const REDIS_KEY = ["FindAllUser", version, page, limit, genders, fromDate, toDate, roles, birthday, JSON.stringify(sort), isBanned, search].join(";");

  const cached = await redis.get(REDIS_KEY);
  if (cached) return JSON.parse(cached);

  const where = {
    deleted_status: "not_deleted",

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

  const result = {
    success: true,
    data: users,
    pagination: {
      page: page,
      pageSize: users.length,
      totalPages: Math.ceil(totalItems / limit),
      totalItems: totalItems,
    },
  };

  redis.setex(REDIS_KEY, REDIS_TTL, JSON.stringify(result));

  return result;
}

export async function FindUser({ id, email }) {
  if (!id && !email) throw CreateError(400, "Require 'id' or 'email'");

  const version = await redisUtils.users(id || email).get();

  const REDIS_KEY = ["FindUser", version, id || email].join(":");

  const cached = await redis.get(REDIS_KEY);
  if (cached) return JSON.parse(cached);

  const user = await db.user.findFirst({
    where: {
      deleted_status: "not_deleted",
      ...(id && { id: id }),
      ...(email && { email: email }),
    },

    include: { avatar: true },
  });

  if (!user) throw CreateError(404, "User not found");

  const result = { success: true, data: user };

  redis.setex(REDIS_KEY, REDIS_TTL, JSON.stringify(result));

  return result;
}

export async function BannedUser({ id, email, isBanned }) {
  if (!id && !email) throw CreateError(400, "'id' or 'email' is required");
  if (!isBanned && typeof isBanned !== "boolean") throw CreateError(400, "'isBanned' is required");
  if (typeof isBanned !== "boolean") throw CreateError(400, "'isBanned' must be boolean");

  const where = {
    deleted_status: "not_deleted",

    ...(id && { id: id }),
    ...(email && { email: email }),
  };

  const bannedUser = await db.user
    .update({
      where: where,
      data: { is_banned: isBanned },
    })
    .catch(async (error) => {
      const user = await db.user.findFirst({ where: where });
      if (!user) throw CreateError(404, "User not found");

      throw new Error(error);
    });

  await redisUtils.users().incr();
  await redisUtils.users(bannedUser.id).incr();
  await redisUtils.users(bannedUser.email).incr();

  return { success: true, data: bannedUser };
}

export async function UpdateUser(id, { name, birthday, gender, avatar, role }) {
  if (!id) throw CreateError(400, "'id' is required");

  gender && throwErrorIfInvalidGenders(gender);

  const update = await db.user
    .update({
      where: {
        id: id,
      },
      data: {
        ...(name && { name: name }),
        ...(birthday && { birthday: new Date(birthday) }),
        ...(gender && { gender: gender }),
        ...(role && { role: role }),
        ...(avatar && { avatar: { connectOrCreate: { where: { url: avatar.url }, create: { url: avatar.url, key: avatar.key } } } }),
      },
      include: { avatar: true },
    })
    .catch(async (error) => {
      const user = await db.user.findFirst({ where: { id: id } });
      if (!user) throw CreateError(404, "User not found");

      throw new Error(error);
    });

  delete update?.password;

  redisUtils.users(update.id).incr();
  redisUtils.users(update.email).incr();
  redisUtils.users().incr();

  return { success: true, data: update };
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

      avatar: {
        connectOrCreate: {
          create: { url: "https://pub-626aeddeabe146fb92f0e8ca1377235a.r2.dev/user/avatar/avatar.png" },
          where: { url: "https://pub-626aeddeabe146fb92f0e8ca1377235a.r2.dev/user/avatar/avatar.png" },
        },
      },
    },

    select: {
      id: true,
      name: true,
      email: true,
      gender: true,
      birthday: true,
      join_date: true,
      role: true,
      avatar: true,
    },
  });

  await redisUtils.users().incr();

  return { success: true, data: user };
}

export async function SoftDeleteUser({ id, email }) {
  if (!id && !email) throw CreateError(400, "'id' or 'email' is required");

  const softDelete = await db.user
    .update({
      where: {
        ...(id && { id: id }),
        ...(email && { email: email }),
      },
      data: { deleted_status: "soft_deleted" },
      select: {
        id: true,
        name: true,
        email: true,
        gender: true,
        birthday: true,
        join_date: true,
        role: true,
        avatar: true,
      },
    })
    .catch(async (error) => {
      const user = await db.user.findUnique({ where: { id: id } });
      if (!user) throw CreateError(404, "User not found");

      throw new Error(error);
    });

  redisUtils.users().incr();
  redisUtils.users(softDelete.id).incr();
  redisUtils.users(softDelete.email).incr();

  return { success: true, data: softDelete };
}

export async function HardDeleteUser({ id, email }) {
  if (!id && !email) throw CreateError(400, "'id' or 'email' is required");

  const hardDelete = await db.user
    .delete({
      where: {
        ...(id && { id: id }),
        ...(email && { email: email }),
      },
    })
    .catch(async (error) => {
      const user = await db.user.findUnique({ where: { id: id } });
      if (!user) throw CreateError(404, "User not found");

      throw new Error(error);
    });

  redisUtils.users().incr();
  redisUtils.users(hardDelete.id).incr();
  redisUtils.users(hardDelete.email).incr();

  return { success: true, data: hardDelete };
}

export async function ChangePassword({ id, email, newPassword }) {
  if (!email && !id) throw CreateError(400, "'id' or 'email' is required");

  const updateUser = await db.user
    .update({
      where: {
        ...(id && { id: id }),
        ...(email && { email: email }),
      },
      data: { password: newPassword },
    })
    .catch(async (error) => {
      const user = await db.user.findFirst({ where: { deleted_status: "not_deleted", ...(id && { id: id }), ...(email && { email: email }) } });
      if (!user) throw CreateError(404, "User not found");

      throw new Error(error);
    });

  await redisUtils.users().incr();

  return { success: !!updateUser, data: updateUser };
}

export async function ResetPassword({ id }) {
  const user = await db.user.findUnique({ where: { id: id, deleted_status: "not_deleted" } });
  if (!user) throw CreateError(404, "User not found");

  const newPassword = RandomPassword(12);

  const resetPassword = await db.user.update({ where: { id: id }, data: { password: newPassword } });

  await redisUtils.users().incr();

  return { success: true, data: resetPassword };
}
