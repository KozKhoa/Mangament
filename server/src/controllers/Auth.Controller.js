import { AddUser, SoftDeleteUser, UpdateUser, FindUser, ChangePassword } from "../models/User.Model.js";
import { CheckEmailAndPasswordFormat } from "../utils/Validators.js";
import { CreateError } from "../utils/ErrorHandle.js";
import { ComparePassword, HashPassword, RandomPassword } from "../utils/PasswordHandle.js";
import { GenAccessToken, GenRefreshToken, SaveTokenOnCookies, VerifyRefreshToken } from "../utils/TokenHandle.js";
import ErrorCodes from "../constants/Error.js";

import { COOKIES_REFRESH_TOKEN_KEY } from "../configs/env.js";
import logger from "../models/LogReport.Model.js";

import * as otpService from "../services/otp.service.js";
import * as mailService from "../services/mail.service.js";
import { AddRefreshToken, FindRefreshToken, HardDeleteRefreshToken } from "../models/Token.Model.js";

export const Login = async (req, res, next) => {
  try {
    const { email, password } = req.body; // Get email and password from request

    CheckEmailAndPasswordFormat(email, password); // Check email and email format

    const result = await FindUser({ email: email }); // Check if user exist in db
    if (!result.success || !result.data) {
      throw CreateError(404, "User not found");
    }
    const user = result.data; // Get user from the result

    if (!(await ComparePassword(password, user.password))) {
      // Compare password
      throw CreateError(401, "Email or password is not correct");
    }

    // If password is correct => Generate refresh token
    const refreshToken = GenRefreshToken({
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
    });
    const accessToken = GenAccessToken({
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
    });

    // Save refresh token to db
    await AddRefreshToken({ userId: user.id, token: refreshToken });

    // Add refresh token to http only
    SaveTokenOnCookies(res, refreshToken);

    // response access token to user
    res.status(200).json({
      success: true,
      message: "Login success",
      data: {
        accessToken: accessToken,
        user: {
          id: user.id,
          name: user.name || "",
          email: email || "",
          role: user.role || "user",
          avatar: user.avatar,
        },
      },
    });
  } catch (error) {
    if (!error.status) {
      logger.error("❌ [Auth.Controller.js] Error login:", error);
    }
    next(error);
  }
};

export const Register = async (req, res, next) => {
  try {
    // Get user name, email, password from require
    const { name, email, password } = req?.body;
    if (!name || !email || !password) throw CreateError(400, "Require 'name', 'email' and 'password'");

    CheckEmailAndPasswordFormat(email, password); // Check email and password format

    // Add user to database
    const user = await AddUser({ name: name, email: email, password: password, avatarUrl: "user/avatar/avatar.png" });
    if (!user) throw CreateError();

    // If adding success =>  gen token
    const refreshToken = GenRefreshToken({
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
    });
    const accessToken = GenAccessToken({
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
    });

    // Save refresh token to db
    await AddRefreshToken({ userId: user.data.id, token: refreshToken });

    // Save refresh token to http only
    SaveTokenOnCookies(res, refreshToken);

    delete user.data.password;
    // Response to user
    res.status(200).json({
      success: true,
      message: "Register success",
      data: {
        accessToken: accessToken,
        user: user.data,
      },
    });
  } catch (error) {
    next(error);
  }
};

export const Logout = async (req, res, next) => {
  try {
    const refreshToken = req.cookies[COOKIES_REFRESH_TOKEN_KEY]; // Get refresht token from http

    // If there are no refresh token => user still not login => alreay logout
    if (!refreshToken) {
      return res.status(200).json({
        success: true,
        message: "Logout success due to missing refresh token",
      });
    }

    // Delete refresh token in db and cookies
    await HardDeleteRefreshToken({ token: refreshToken });
    res.clearCookie(COOKIES_REFRESH_TOKEN_KEY);

    // Response to user
    res.status(200).json({
      success: true,
      message: "Logout success",
    });
  } catch (error) {
    if (!error.status) console.error("❌ [Auth.Controller.js] Error logout:", error);
    next(error);
  }
};

export const Refresh = async (req, res, next) => {
  try {
    const refreshToken = req.cookies[COOKIES_REFRESH_TOKEN_KEY]; // Get refreh token from cookies
    if (!refreshToken) throw CreateError(401, "Token is invalid");

    const { decodedToken, isExpire } = VerifyRefreshToken(refreshToken);

    // Token is expired
    if (isExpire) {
      throw CreateError(401, "Token has been expired");
    } else if (!decodedToken || !decodedToken.id) {
      throw CreateError(401, "Token is invalid");
    }

    const user = decodedToken; // Get user
    // Check if refresh token is on db or user is real or not
    const result = await FindRefreshToken({
      user_id: user.id,
      token: refreshToken,
    });
    // If token is not found in db
    if (!result.success || !result.data) {
      throw CreateError(401, "Token is invalid");
    }

    // Generate new access token
    const accessToken = GenAccessToken({
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
    });

    // Response access token to user
    res.status(200).json({
      success: true,
      message: "Get new access token success",
      data: {
        token: accessToken,
        user: {
          id: user.id,
          name: user.name || "",
          email: user.email || "",
          role: user.role || "user",
        },
      },
    });
  } catch (error) {
    if (!error.status) console.error("❌ [Auth.Controller.js] Error refresh:", error);
    next(error);
  }
};

export async function ForgotPassword(req, res, next) {
  try {
    const email = req?.body?.email;
    if (!email) throw CreateError(400, "'email' is required");

    // const cooldownTime = await otpService.cooldownTimeLeft(email);
    // if (cooldownTime > 0) {
    //   const minutes = Math.floor(cooldownTime / 60);
    //   const seconds = cooldownTime % 60;
    //   throw CreateError({ status: 400, message: `OTP request is on cooldown. Please wait ${minutes} minutes and ${seconds} seconds.` });
    // }

    const otp = otpService.generateOtp(email);

    await otpService.saveOtp(email, otp.toString());

    mailService.sendOtpEmail(email, otp);

    return res.status(200).json({ success: true, message: "OTP has been sent to your email" });
  } catch (error) {
    next(error);
  }
}

export async function ResetPassword(req, res, next) {
  try {
    const otp = req?.body?.otp;
    const email = req?.body?.email;
    if (!otp || !email) throw CreateError(400, "Both 'otp' and 'email' is require");

    const verify = await otpService.verifyOtp(email, otp);

    if (!verify || !verify.success) {
      return res.status(400).json({ success: false, message: verify.message });
    }

    // Reset password
    const newPassword = RandomPassword(30);
    const newHashPassword = await HashPassword(newPassword);
    await ChangePassword({ email: email, newPassword: newHashPassword });

    mailService.sendPasswordEmail(email, newPassword);

    return res.status(200).json({ success: true, message: "New password has been sent to your email" });
  } catch (err) {
    next(err);
  }
}
