import ErrorCodes from "../constants/Error.js";
import { VerifyAccessToken } from "../utils/TokenHandle.js";
import { FindUser } from "../models/User.Model.js";

export const AuthenticationToken = async (req, res, next) => {
  // Determine who you are (your id, name, email,...)
  try {
    // if user do not have token
    if (!req.headers.authorization || !req.headers.authorization.startsWith("Bearer")) {
      return res.status(ErrorCodes.UNAUTHORIZED.status).json({
        success: false,
        message: ErrorCodes.UNAUTHORIZED.message,
      });
    }

    // Get token from authorization
    const token = req.headers.authorization.split(" ")[1];

    // Decoded token
    const { decodedToken, isExpire } = VerifyAccessToken(token);
    if (isExpire) {
      return res.status(ErrorCodes.TOKEN_EXPIRED.status).json({ success: false, message: ErrorCodes.TOKEN_EXPIRED.message });
    } else if (!decodedToken || !decodedToken.id) {
      return res.status(ErrorCodes.TOKEN_INVALID.status).json({ success: false, message: ErrorCodes.TOKEN_INVALID.message });
    }

    // Check if user exist
    const checkUser = await FindUser({ id: decodedToken.id });
    if (!checkUser || !checkUser.success || !checkUser.data) {
      return res.status(ErrorCodes.TOKEN_INVALID.status).json({ success: false, message: ErrorCodes.TOKEN_INVALID.message });
    }

    // Put user info into reqeust
    const user = checkUser.data;
    req.user = {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
    };

    next();
  } catch (error) {
    next(error);
  }
};

export const AuthorizationRole = (req, res, next) => {
  // Determine you permistion, if you are not admin, you cannto access this request
  try {
    const role = req?.user?.role;
    if (!role) {
      return res.status(ErrorCodes.BAD_REQUEST.status).json({
        success: false,
        message: ErrorCodes.BAD_REQUEST.message,
      });
    }

    // If you are not the admin
    if (role !== "admin") {
      return res.status(ErrorCodes.FORBIDDEN.status).json({
        success: false,
        message: ErrorCodes.FORBIDDEN.message,
      });
    }

    // If you are the admin
    next();
  } catch (error) {
    console.error("❌ [Auth.Controller.js] Error getting user info:", error);
    res.status(ErrorCodes.INTERNAL_SERVER_ERROR.status).json({
      success: false,
      message: ErrorCodes.INTERNAL_SERVER_ERROR.message,
    });
  }
};

// Verify user, if not user, still be able to call api
export const OptionalAuth = async (req, res, next) => {
  // Determine who you are (your id, name, email,...)
  try {
    // if user do not have token
    if (!req.headers.authorization || !req.headers.authorization.startsWith("Bearer")) {
      return next();
    }

    // Get token from authorization
    const token = req.headers.authorization.split(" ")[1];

    // Decoded token
    const { decodedToken, isExpire } = VerifyAccessToken(token);
    if (isExpire || !decodedToken || !decodedToken.id) {
      return next();
    }

    // Check if user exist
    const checkUser = await FindUser({ id: decodedToken.id });
    if (!checkUser || !checkUser.success || !checkUser.data) {
      return next();
    }

    // Put user info into reqeust
    const user = checkUser.data;
    req.user = {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
    };

    next();
  } catch (error) {
    next(error);
  }
};
