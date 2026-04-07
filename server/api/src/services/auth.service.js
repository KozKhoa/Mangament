import db from "../configs/db.js";
import { CreateError } from "../utils/ErrorHandle.js";
import * as crypto from "crypto";
import bcrypt from "bcrypt";
import { redis } from "../configs/redis.js";

import { throwErrorIfInvalidEmailAndPassword } from "../utils/Validators.js";

import * as passwordUtils from "../utils/Password.js";
import * as tokenUtils from "../utils/Token.js";
import * as mailQueue from "../queues/mail.queue.js";

const AVATAR_DEFAUTL_KEY = "user/avatar/avatar.png";

const OTP_EXPIRATION_TIME = 5 * 60; // 5 minutes
const MAX_RETRY_COUNT = 5;
const SHORT_COOLDOWN_TIME = 60;

class AuthService {
  async #isOnCoolDown(email) {
    return await redis.get(`otp_cooldown:${email}`);
  }

  async #startCoolDown(email) {
    await redis.setex(`otp_cooldown:${email}`, SHORT_COOLDOWN_TIME, "true");
  }

  async #generateOtp(email) {
    const isOnCoolDown = await redis.get(`otp_cooldown:${email}`);

    const otp = crypto.randomInt(100000, 1000000); // Ensure it's a 6-digit number
    return otp;
  }

  async #saveOtp(email, otp) {
    const salt = await bcrypt.genSalt(10);
    const hashedOtp = await bcrypt.hash(otp, salt);

    await redis.setex(`otp:${email}`, OTP_EXPIRATION_TIME, hashedOtp);
    await redis.setex(`otp_retry:${email}`, OTP_EXPIRATION_TIME, 0);
  }

  async #verifyOtp(email, otp) {
    // Check user retry count
    const retry = Number(await redis.get(`otp_retry:${email}`)) || 0;

    if (retry >= MAX_RETRY_COUNT) throw CreateError(400, "Maximum retry attempts reached");

    const hashedSaveOtp = await redis.get(`otp:${email}`);

    if (hashedSaveOtp) {
      const compare = await bcrypt.compare(otp, hashedSaveOtp);
      if (compare) {
        return true;
      } else {
        await redis.incr(`otp_retry:${email}`);
      }
    }
    return false;
  }

  async login(email, password) {
    const user = await db.user.findUnique({
      where: { email: email },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        password: true,
        avatar: { select: { key: true, url: true, width: true, height: true } },
      },
    });

    if (!user) throw CreateError(404, "User not found");

    if (!(await passwordUtils.ComparePassword(password, user.password))) throw CreateError(401, "Email or password is not correct");

    delete user.password;

    // If password is correct => Generate refresh token
    const refreshToken = tokenUtils.GenRefreshToken({
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
    });

    const accessToken = tokenUtils.GenAccessToken({
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
    });

    await db.refreshToken.create({ data: { user: { connect: { id: user.id } }, token: refreshToken } });

    return { success: true, data: { user: user, accessToken: accessToken, refreshToken: refreshToken } };
  }

  async register(name, email, password) {
    if (!name || !email || !password) throw CreateError(400, "Require 'name', 'email' and 'password'");

    throwErrorIfInvalidEmailAndPassword(email, password); // Check email and password format

    // Add user to database
    const user = await db.user.findUnique({ where: { email: email } });
    if (user) throw CreateError(400, "User already exists");

    const newUser = await db.user.create({
      data: {
        email: email,
        name: name,
        password: await passwordUtils.HashPassword(password),
        avatar: { connect: { key: AVATAR_DEFAUTL_KEY } },
      },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        avatar: { select: { key: true, url: true, width: true, height: true } },
      },
    });

    const accessToken = tokenUtils.GenAccessToken({
      id: newUser.id,
      name: newUser.name,
      email: newUser.email,
      role: newUser.role,
    });
    const refreshToken = tokenUtils.GenRefreshToken({
      id: newUser.id,
      name: newUser.name,
      email: newUser.email,
      role: newUser.role,
    });

    // Response to user
    return { success: true, data: { user: newUser, accessToken: accessToken, refreshToken: refreshToken } };
  }

  async logout(refreshToken) {
    await db.refreshToken.delete({ where: { token: refreshToken } });

    return { success: true, data: {} };
  }

  async refresh(refreshToken) {
    const { decodedToken, isExpire } = tokenUtils.VerifyRefreshToken(refreshToken);

    if (isExpire) {
      throw CreateError(401, "Token has been expired");
    } else if (!decodedToken || !decodedToken.id) {
      throw CreateError(401, "Token is invalid");
    }

    const userId = decodedToken.id;

    const dbRefreshToken = await db.refreshToken.findUnique({ where: { token: refreshToken }, select: { token: true } });
    if (!dbRefreshToken?.token) throw CreateError(404, "Refresh token not found");

    const user = await db.user.findFirst({ where: { id: userId, deleted_status: "not_deleted" }, select: { id: true, is_banned: true } });
    if (!user) throw CreateError(404, "User not found");

    if (user.is_banned) throw CreateError(403, "User is banned");

    const newAccessToken = tokenUtils.GenAccessToken({
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
    });

    return { success: true, data: { accessToken: newAccessToken } };
  }

  async forgotPassword(email) {
    if (await this.#isOnCoolDown(email)) {
      throw CreateError(400, "OTP is on cooldown, please try again (60s) later");
    }

    const user = await db.user.findUnique({ where: { email: email } });
    if (!user) throw CreateError("Email not founded");

    const otp = await this.#generateOtp(email);

    await this.#saveOtp(email, otp.toString());
    await this.#startCoolDown(email);

    mailQueue.AddJobSendOtp(email, otp);
  }

  async resetPassword(email, otp) {
    const verifyOtp = await this.#verifyOtp(email, otp);
    if (!verifyOtp) throw CreateError(400, "Invalid OTP");

    const newPassword = passwordUtils.RandomPassword(8);
    const newHashPassword = await passwordUtils.HashPassword(newPassword);

    await db.user.update({ where: { email: email }, data: { password: newHashPassword } });

    mailQueue.AddJobSendNewPassword(email, newPassword);

    return { success: true, message: "Reset password successfully" };
  }

  async changePassword(userId, oldPassword, newPassword, refreshToken) {
    const user = await db.user.findUnique({ where: { id: userId, deleted_status: "not_deleted" }, select: { password: true } });

    if (!user) throw CreateError(404, "User not found");

    if (!(await passwordUtils.ComparePassword(oldPassword, user.password))) throw CreateError(401, "Old password is not correct");

    const newHashPassword = await passwordUtils.HashPassword(newPassword);

    await db.user.update({ where: { id: userId }, data: { password: newHashPassword } });
    await db.refreshToken.delete({ where: { token: refreshToken } });

    return { success: true, message: "Change password successfully" };
  }
}

const authService = new AuthService();

export default authService;
