import jwt from "jsonwebtoken";

export const GenRefreshToken = ({ id, name, email, role }) => {
  try {
    return jwt.sign({ id: id, name: name, email: email, role: role }, process.env.JWT_REFRESH_SECRET, {
      expiresIn: process.env.JWT_REFRESH_EXPIRES_IN,
    });
  } catch (error) {
    console.error("Error gen refresh token:", error);
  }
};

export const GenAccessToken = ({ id, name, email, role }) => {
  try {
    return jwt.sign({ id: id, name: name, email: email, role: role }, process.env.JWT_ACCESS_SECRET, {
      expiresIn: process.env.JWT_ACCESS_EXPIRES_IN,
    });
  } catch (error) {
    console.error("Error gen asccess token:", error);
  }
};

export function VerifyRefreshToken(token) {
  try {
    const decodedToken = jwt.verify(token, process.env.JWT_REFRESH_SECRET);
    // Nếu verify thành công -> token còn hạn
    return { decodedToken: decodedToken, isExpire: false };
  } catch (err) {
    if (err.name === "TokenExpiredError") {
      return { decodedToken: null, isExpire: true };
    }
    return { decodedToken: null, isExpire: true }; // token sai hoặc hết hạn
  }
}

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
