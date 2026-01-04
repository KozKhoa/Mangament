import { config } from "dotenv";
config({ path: ".env" });

export const {
  PORT,
  DATABASE_URL,

  JWT_REFRESH_SECRET,
  JWT_REFRESH_EXPIRES_IN,

  JWT_ACCESS_SECRET,
  JWT_ACCESS_EXPIRES_IN,

  COOKIES_REFRESH_TOKEN_KEY,

  EMAIL_USER,
  EMAIL_APP_PASSWORD,
} = process.env;
