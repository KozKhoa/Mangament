import { isPrismaError } from "../utils/Validators.js";

const ErrorMiddleware = (err, req, res) => {
  try {
    console.log(err);

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
