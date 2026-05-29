import db from "../../configs/db.js";
import { CreateError } from "../utils/ErrorHandle.js";
import * as crypto from "crypto";
import bcrypt from "bcrypt";
import { redis } from "../../configs/redis.js";
import { OAuth2Client } from "google-auth-library";

import { throwErrorIfInvalidEmailAndPassword } from "../utils/Validators.js";

import * as passwordUtils from "../utils/Password.js";
import * as tokenUtils from "../utils/Token.js";

import mailService from "./mail.service.js";

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

  async #generateOtp() {
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

  async loginWithGoogle(idToken) {
    const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);
    const ticket = await client.verifyIdToken({
      idToken,
      audience: process.env.GOOGLE_CLIENT_ID,
    });

    const payload = ticket.getPayload();

    const { email, name, picture, sub } = payload;

    let user = await db.user.findUnique({
      where: { email: email },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        avatar: { select: { key: true, url: true, width: true, height: true } },
      },
    });

    if (!user) {
      user = await db.user.create({
        data: {
          email: email,
          name: name,
          accounts: {
            create: {
              provider: "google",
              provider_account_id: sub,
            },
          },
          avatar: {
            create: {
              url: picture,
              key: `user/avatar/${email}_google_${Date.now()}`,
            },
          },
        },
        select: {
          id: true,
          email: true,
          name: true,
          role: true,
          avatar: { select: { key: true, url: true, width: true, height: true } },
        },
      });
    }

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

  async login(email, password) {
    const user = await db.user.findUnique({
      where: { email: email },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        accounts: {
          where: { provider: "email" },
          select: { password: true },
        },
        avatar: { select: { key: true, url: true, width: true, height: true } },
      },
    });

    if (!user) throw CreateError(404, "User not found");

    const emailAccount = user.accounts[0];
    if (!emailAccount || !emailAccount.password) throw CreateError(401, "This account does not have a password login method");

    if (!(await passwordUtils.ComparePassword(password, emailAccount.password))) throw CreateError(401, "Email or password is not correct");

    delete user.accounts;

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

    const user = await db.user.findUnique({ where: { email: email } });
    if (user) throw CreateError(400, "User already exists");

    const hashedPassword = await passwordUtils.HashPassword(password);

    const newUser = await db.user.create({
      data: {
        email: email,
        name: name,
        accounts: {
          create: {
            provider: "email",
            provider_account_id: email,
            password: hashedPassword,
          },
        },
        avatar: { connect: { key: process.env.DEFAULT_AVATAR_IAMGE_KEY } },
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
    await db.refreshToken.delete({ where: { token: refreshToken } }).catch(async () => {
      return { success: true, message: "Refresh toke not found" };
    });

    return { success: true, message: "Logout successfully" };
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

    mailService.sendOtpEmail(email, otp);
  }

  async resetPassword(email, otp) {
    const verifyOtp = await this.#verifyOtp(email, otp);
    if (!verifyOtp) throw CreateError(400, "Invalid OTP");

    const newPassword = passwordUtils.RandomPassword(8);
    const newHashPassword = await passwordUtils.HashPassword(newPassword);

    await db.account.update({
      where: {
        provider_provider_account_id: {
          provider: "email",
          provider_account_id: email,
        },
      },
      data: { password: newHashPassword },
    });

    mailService.sendPasswordEmail(email, newPassword);

    return { success: true, message: "Reset password successfully" };
  }

  async changePassword(userId, oldPassword, newPassword, refreshToken) {
    const user = await db.user.findUnique({
      where: { id: userId, deleted_status: "not_deleted" },
      select: {
        accounts: {
          where: { provider: "email" },
          select: { password: true },
        },
      },
    });

    if (!user) throw CreateError(404, "User not found");

    const emailAccount = user.accounts[0];
    if (!emailAccount || !emailAccount.password) throw CreateError(401, "This account does not have a password login method");

    if (!(await passwordUtils.ComparePassword(oldPassword, emailAccount.password))) throw CreateError(401, "Old password is not correct");

    const newHashPassword = await passwordUtils.HashPassword(newPassword);

    await db.account.update({
      where: {
        provider_provider_account_id: {
          provider: "email",
          provider_account_id: (await db.user.findUnique({ where: { id: userId }, select: { email: true } })).email,
        },
      },
      data: { password: newHashPassword },
    });
    await db.refreshToken.delete({ where: { token: refreshToken } });

    return { success: true, message: "Change password successfully" };
  }
}

const authService = new AuthService();

export default authService;
