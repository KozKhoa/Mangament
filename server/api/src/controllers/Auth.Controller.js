import { throwErrorIfInvalidEmailAndPassword } from "../utils/Validators.js";
import { CreateError } from "../utils/ErrorHandle.js";

import authService from "../services/auth.service.js";
import { access } from "fs";

function putRefreshTokenToCookie(res, refreshToken) {
  res.cookie(process.env.COOKIES_REFRESH_TOKEN_KEY, refreshToken, {
    httpOnly: true,
    secure: true, // bắt buộc khi dùng HTTPS
    sameSite: "none",
    path: "/auth/refresh",
    maxAge: 7 * 24 * 60 * 60 * 1000,
  });
}

export async function Login(req, res, next) {
  try {
    const { email, password } = req.body; // Get email and password from request

    throwErrorIfInvalidEmailAndPassword(email, password); // Check email and email format

    const { user, accessToken, refreshToken } = (await authService.login(email, password)).data;

    // Add refresh token to http only
    putRefreshTokenToCookie(res, refreshToken);

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
    next(error);
  }
}

export async function Register(req, res, next) {
  try {
    // Get user name, email, password from require
    const { name, email, password } = req?.body;
    if (!name || !email || !password) throw CreateError(400, "Require 'name', 'email' and 'password'");

    throwErrorIfInvalidEmailAndPassword(email, password); // Check email and password format

    const newUser = await authService.register(name, email, password);
    if (!newUser) throw CreateError();

    putRefreshTokenToCookie(res, newUser.data.refreshToken);

    res.status(200).json({
      success: true,
      message: "Register success",
      data: {
        user: newUser.data,
        accessToken: newUser.data.accessToken,
      },
    });
  } catch (error) {
    next(error);
  }
}

export async function Logout(req, res, next) {
  try {
    const refreshToken = req.cookies[process.env.COOKIES_REFRESH_TOKEN_KEY]; // Get refresht token from http

    // If there are no refresh token => user still not login => alreay logout
    if (!refreshToken) {
      return res.status(200).json({
        success: true,
        message: "Logout success due to missing refresh token",
      });
    }

    await authService.logout();

    res.clearCookie(process.env.COOKIES_REFRESH_TOKEN_KEY);

    // Response to user
    res.status(200).json({
      success: true,
      message: "Logout success",
    });
  } catch (error) {
    next(error);
  }
}

export async function Refresh(req, res, next) {
  try {
    const refreshToken = req.cookies[process.env.COOKIES_REFRESH_TOKEN_KEY]; // Get refreh token from cookies
    if (!refreshToken) throw CreateError(401, "Cannot find refresh token");

    const { accessToken } = (await authService.refresh(refreshToken)).data;

    res.status(200).json({
      success: true,
      message: "Get new access token success",
      data: {
        accessToken: accessToken,
      },
    });
  } catch (error) {
    next(error);
  }
}

export async function ForgotPassword(req, res, next) {
  try {
    const email = req?.body?.email;
    if (!email) throw CreateError(400, "'email' is required");

    await authService.forgotPassword(email);

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

    await authService.resetPassword(email, otp);

    return res.status(200).json({ success: true, message: "New password has been sent to your email" });
  } catch (err) {
    next(err);
  }
}
