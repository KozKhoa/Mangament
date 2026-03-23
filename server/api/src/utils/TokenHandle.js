import jwt from "jsonwebtoken";

export const GenRefreshToken = ({ id, name, email, role }) => {
  try {
    return jwt.sign({ id: id, name: name, email: email, role: role }, process.env.JWT_REFRESH_SECRET, {
      expiresIn: process.env.JWT_REFRESH_EXPIRES_IN,
    });
  } catch (error) {
    console.error("❌ [TokenHandle.js] Error gen refresh token:", error);
  }
};

export const GenAccessToken = ({ id, name, email, role }) => {
  try {
    return jwt.sign({ id: id, name: name, email: email, role: role }, process.env.JWT_ACCESS_SECRET, {
      expiresIn: process.env.JWT_ACCESS_EXPIRES_IN,
    });
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
    const decodedToken = jwt.verify(token, process.env.JWT_ACCESS_SECRET);
    // Nếu verify thành công -> token còn hạn
    return { decodedToken: decodedToken, isExpire: false };
  } catch (err) {
    if (err.name === "TokenExpiredError") {
      return { decodedToken: null, isExpire: true };
    }
    return { decodedToken: null, isExpire: false }; // token sai hoặc hết hạn
  }
};

export function SaveTokenOnCookies(res, token) {
  res.cookie(process.env.COOKIES_REFRESH_TOKEN_KEY, token, {
    httpOnly: true,
    // secure: true,     // bắt buộc khi dùng HTTPS
    secure: false,
    sameSite: "lax",
    //   path: ["/api/auth/refresh", "api/auth/logout"]
  });
}
