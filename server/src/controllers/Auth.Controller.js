import {
  AddUser,
  SoftDeleteUser,
  UpdateUser,
  FindUser,
  HardDeleteRefreshToken,
  AddRefreshToken,
  FindRefreshToken,
} from "../models/User.Model.js";
import { CheckEmailAndPasswordFormat } from "../utils/Validators.js";
import { CreateError } from "../configs/ErrorHandle.js";
import { ComparePassword, HashPassword } from "../configs/PasswordHandle.js";
import {
  GenAccessToken,
  GenRefreshToken,
  SaveTokenOnCookies,
  VerifyRefreshToken,
} from "../configs/TokenHandle.js";
import ErrorCodes from "../constants/Error.js";

import { COOKIES_REFRESH_TOKEN_KEY } from "../configs/env.js";

export const Login = async (req, res, next) => {
  try {
    const { email, password } = req.body; // Get email and password from request

    CheckEmailAndPasswordFormat(email, password); // Check email and email format

    const result = await FindUser({ email: email }); // Check if user exist in db
    if (!result.success || !result.data[0]) {
      throw CreateError(ErrorCodes.USER_NOT_FOUND);
    }
    const user = result.data[0]; // Get user from the result

    if (!(await ComparePassword(password, user.password))) {
      // Compare password
      throw CreateError(ErrorCodes.INVALID_LOGIN);
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
    await AddRefreshToken({ user_id: user.id, token: refreshToken });

    // Add refresh token to http only
    SaveTokenOnCookies(res, refreshToken);

    // response access token to user
    res.status(200).json({
      success: true,
      message: "Login success",
      token: accessToken,
      user: {
        id: user.id,
        name: user.name || "",
        email: email || "",
        role: user.role || "user",
      },
    });
  } catch (error) {
    console.error("❌ [Auth.Controller.js] Error login:", error);
    next(error);
  }
};

export const Register = async (req, res, next) => {
  try {
    const { name, email, password } = req.body; // get user name, email, password from require

    CheckEmailAndPasswordFormat(email, password); // Check email and password format

    const checkUserExist = await FindUser({ email: email }); // Check user aldready exist
    if (checkUserExist.success && checkUserExist.data[0]) {
      throw CreateError(ErrorCodes.USER_ALREADY_EXIST);
    }

    // Hash password
    const hashedPassword = await HashPassword(password);

    // Try to add user to db, if adding is fail with code P2002 => user already existed
    const addingUser = await AddUser({ name, email, password: hashedPassword });
    if (!addingUser.success) {
      throw CreateError(ErrorCodes.INTERNAL_SERVER_ERROR);
    }

    // If adding success =>  gen token
    const user = addingUser.data;
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
    await AddRefreshToken({ user_id: user.id, token: refreshToken });

    // Save refresh token to http only
    SaveTokenOnCookies(res, refreshToken);

    // Response to user
    res.status(200).json({
      success: true,
      message: "Register success",
      token: accessToken,
      user: {
        id: user.id,
        email: user.email || "",
        name: user.name || "",
        role: user.role || "user",
      },
    });
  } catch (error) {
    console.error("❌ [Auth.Controller.js] Error register:", error);
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
    console.error("❌ [Auth.Controller.js] Error logout:", error);
    next(error);
  }
};

export const Refresh = async (req, res, next) => {
  try {
    const refreshToken = req.cookies[COOKIES_REFRESH_TOKEN_KEY]; // Get refreh token from cookies
    if (!refreshToken) throw CreateError(ErrorCodes.FORBIDDEN);

    const { decodedToken, isExpired } = VerifyRefreshToken(refreshToken);
    // Token is expired
    if (isExpired) {
      throw CreateError(ErrorCodes.TOKEN_EXPIRED);
    } else if (!decodedToken || !decodedToken.id) {
      throw CreateError(ErrorCodes.TOKEN_INVALID);
    }

    const user = decodedToken; // Get user
    // Check if refresh token is on db or user is real or not
    const result = await FindRefreshToken({
      user_id: user.id,
      token: refreshToken,
    });
    // If token is not found in db
    if (!result.success || !result.data) {
      throw CreateError(ErrorCodes.TOKEN_INVALID);
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
      token: accessToken,
      user: {
        id: user.id,
        name: user.name || "",
        email: user.email || "",
        role: user.role || "user",
      },
    });
  } catch (error) {
    console.error("❌ [Auth.Controller.js] Error refresh:", error);
    next(error);
  }
};
