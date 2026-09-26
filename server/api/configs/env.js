import dotenvFlow from "dotenv-flow";

dotenvFlow.config({ path: ".env.local" });
dotenvFlow.config({ path: `.env.${process.env.NODE_ENV || "development"}` });

export const {
  PORT,

  JWT_REFRESH_SECRET,
  JWT_REFRESH_EXPIRES_IN,

  JWT_ACCESS_SECRET,
  JWT_ACCESS_EXPIRES_IN,

  COOKIES_REFRESH_TOKEN_KEY,

  EMAIL_USER,
  EMAIL_APP_PASSWORD,

  PUBLIC_DIR,
  TEMP_DIR,
  CLEANUP_ZIP_AFTER_PROCESSING,
  MIN_DISK_FREE_SPACE_MB,
} = process.env;
