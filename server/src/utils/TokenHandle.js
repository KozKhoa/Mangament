import jwt from "jsonwebtoken";

import {
  JWT_ACCESS_SECRET,
  JWT_ACCESS_EXPIRES_IN,
  JWT_REFRESH_SECRET,
  JWT_REFRESH_EXPIRES_IN,
  COOKIES_REFRESH_TOKEN_KEY,
} from "../configs/env.js";

export const GenRefreshToken = ({ id, name, email, role }) => {
  try {
    return jwt.sign(
      { id: id, name: name, email: email, role: role },
      JWT_REFRESH_SECRET,
      {
        expiresIn: JWT_REFRESH_EXPIRES_IN,
      }
    );
  } catch (error) {
    console.error("❌ [TokenHandle.js] Error gen refresh token:", error);
  }
};

export const GenAccessToken = ({ id, name, email, role }) => {
  try {
    return jwt.sign(
      { id: id, name: name, email: email, role: role },
      JWT_ACCESS_SECRET,
      {
        expiresIn: JWT_ACCESS_EXPIRES_IN,
      }
    );
  } catch (error) {
    console.error("❌ [TokenHandle.js] Error gen asccess token:", error);
  }
};

export const VerifyRefreshToken = (token) => {
  try {
    const decodedToken = jwt.verify(token, JWT_REFRESH_SECRET);
    // Nếu verify thành công -> token còn hạn
    return { decodedToken: decodedToken, isExpire: false };
  } catch (err) {
    if (err.name === "TokenExpiredError") {
      return { decodedToken: null, isExpire: true };
    }
    return { decodedToken: null, isExpire: true }; // token sai hoặc hết hạn
  }
};

export const VerifyAccessToken = (token) => {
  try {
    const decodedToken = jwt.verify(token, JWT_ACCESS_SECRET);
    // Nếu verify thành công -> token còn hạn
    return { decodedToken: decodedToken, isExpire: false };
  } catch (err) {
    if (err.name === "TokenExpiredError") {
      return { decodedToken: null, isExpire: true };
    }
    return { decodedToken: null, isExpire: true }; // token sai hoặc hết hạn
  }
};

export const SaveTokenOnCookies = (res, token) => {
  res.cookie(COOKIES_REFRESH_TOKEN_KEY, token, {
    httpOnly: true,
    // secure: true,     // bắt buộc khi dùng HTTPS
    secure: false,
    sameSite: "strict",
    //   path: ["/api/auth/refresh", "api/auth/logout"]
  });
};
