import { CreateError } from "../configs/ErrorHandle.js";
import ErrorCodes from "../constants/Error.js";
import { VerifyAccessToken } from "../configs/TokenHandle.js";
import { FindUser } from "../models/User.Model.js";

const AuthorizationMiddleware = async (req, res, next) => {
  try {
    // if user do not have token
    if (
      !req.headers.authorization ||
      !req.headers.authorization.startsWith("Bearer")
    ) {
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
      return res
        .status(ErrorCodes.TOKEN_EXPIRED.status)
        .json({ success: false, message: ErrorCodes.TOKEN_EXPIRED.message });
    } else if (!decodedToken || !decodedToken.id) {
      return res
        .status(ErrorCodes.TOKEN_INVALID.status)
        .json({ success: false, message: ErrorCodes.TOKEN_INVALID.message });
    }

    // Check if user exist
    const checkUser = await FindUser({ id: decodedToken.id });
    if (!checkUser || !checkUser.success || !checkUser.data) {
      return res
        .status(ErrorCodes.TOKEN_INVALID.status)
        .json({ success: false, message: ErrorCodes.TOKEN_INVALID.message });
    }

    // Put user info into reqeust
    const user = checkUser.data;
    req.user = { id: user.id, name: user.name, email: user.email };

    next();
  } catch (error) {
    console.error("❌ [Auth.Middleware.js] Error authorization:", error);
    return res.status(ErrorCodes.INTERNAL_SERVER_ERROR.status).json({
      success: false,
      message: ErrorCodes.INTERNAL_SERVER_ERROR.message,
    });
  }
};

export default AuthorizationMiddleware;
