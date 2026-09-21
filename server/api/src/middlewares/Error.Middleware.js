import multer from "multer";
import { isPrismaError } from "../utils/Validators.js";

// eslint-disable-next-line no-unused-vars
const ErrorMiddleware = (err, req, res, next) => {
  try {
    console.log(err);

    if (err instanceof multer.MulterError) {
      if (err.code === "LIMIT_FILE_SIZE") {
        return res.status(413).json({
          success: false,
          message: "Dung lượng file vượt quá giới hạn tối đa 20MB",
        });
      }

      if (err.code === "LIMIT_FILE_COUNT" || err.code === "LIMIT_UNEXPECTED_FILE") {
        return res.status(400).json({
          success: false,
          message: "Số lượng file tải lên vượt quá giới hạn tối đa 50 ảnh cho mỗi lần upload",
        });
      }

      return res.status(400).json({
        success: false,
        message: err.message,
      });
    }

    if (isPrismaError(err)) {
      if (err.code == "P1001" || err.code == "P2024") {
        err.message = "Cannot connect with database";
      }

      err.message = "Database error";
    }

    res.status(err.status || 500).json({
      success: false,
      message: err.message,
    });
  } catch (error) {
    console.error("❌ [Error.Middlesware.js] Handle error fail:", error);
  }
};

export default ErrorMiddleware;
