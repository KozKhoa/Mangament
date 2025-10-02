// errors.js
const ErrorCodes = {
  // 🔑 Auth & User
  INVALID_LOGIN: {
    status: 401,
    message: "Email or password is not correct",
  },
  REQUIRED_EMAIL: {
    status: 400,
    message: "Email is required",
  },
  REQUIRED_PASSWORD: {
    status: 400,
    message: "Password is required",
  },
  UNAUTHORIZED: {
    status: 401,
    message: "Unauthorized access",
  },
  FORBIDDEN: {
    status: 403,
    message: "You do not have permission to perform this action",
  },
  TOKEN_EXPIRED: {
    status: 401,
    message: "Token has expired",
  },
  TOKEN_INVALID: {
    status: 401,
    message: "Token is invalid",
  },

  // 📦 Database / Prisma
  UNIQUE_CONSTRAINT: {
    status: 409,
    message: "Record already exists (duplicate value)",
  },
  FOREIGN_KEY_CONSTRAINT: {
    status: 400,
    message: "Invalid reference to another record",
  },
  RECORD_NOT_FOUND: {
    status: 404,
    message: "Record not found",
  },
  VALIDATION_ERROR: {
    status: 400,
    message: "Validation error",
  },

  // 📂 File upload
  FILE_TOO_LARGE: {
    status: 413,
    message: "Uploaded file is too large",
  },
  UNSUPPORTED_FILE_TYPE: {
    status: 415,
    message: "Unsupported file type",
  },
  FILE_UPLOAD_FAILED: {
    status: 500,
    message: "File upload failed",
  },

  // 🌐 Request & API
  BAD_REQUEST: {
    status: 400,
    message: "Bad request",
  },
  NOT_FOUND: {
    status: 404,
    message: "Endpoint not found",
  },
  METHOD_NOT_ALLOWED: {
    status: 405,
    message: "HTTP method not allowed",
  },
  RATE_LIMIT_EXCEEDED: {
    status: 429,
    message: "Too many requests, please try again later",
  },

  // ⚙️ Server
  INTERNAL_SERVER_ERROR: {
    status: 500,
    message: "Internal server error",
  },
  SERVICE_UNAVAILABLE: {
    status: 503,
    message: "Service temporarily unavailable",
  },
  TIMEOUT: {
    status: 504,
    message: "Request timed out",
  },

  // 🔐 Input
  INVALID_INPUT: {
    status: 400,
    message: "Invalid input data",
  },
  MISSING_FIELD: {
    status: 400,
    message: "Missing required field",
  },
  INVALID_EMAIL_FORMAT: {
    status: 400,
    message: "Email format is not valid ",
  },
  INVALID_PASSWORD_FORMAT: {
    status: 400,
    message: "Password format is not valid ",
  },

  // Domain-specific (business logic)
  USER_NOT_FOUND: {
    status: 404,
    message: "User not found",
  },
  STORY_NOT_FOUND: {
    status: 404,
    message: "Story not found",
  },
  STORY_NODE_NOT_FOUND: {
    status: 404,
    message: "Story node not found",
  },
  IMAGE_NOT_FOUND: {
    status: 404,
    message: "Image not found",
  },
  READING_HISTORY_NOT_FOUND: {
    status: 404,
    message: "Reading history not found",
  },
  USER_ALREADY_EXIST: {
    status: 409,
    message: "Email has alrealy been used",
  },
};

export default ErrorCodes;
