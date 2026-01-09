import { CreateError } from "../utils/ErrorHandle.js";
import ErrorCodes from "../constants/Error.js";

export const IsValidEmail = (email) => {
  const regex = new RegExp("^[^\\s@]+@[^\\s@]+\\.[^\\s@]+$");
  return regex.test(email);
};

export const CheckEmailAndPasswordFormat = (email, password) => {
  // Nếu email và passworđ sai format thì throw lỗi ra luôn
  // Kiểm tra có nhập đầy đủ email hay không
  if (!email) {
    throw CreateError(ErrorCodes.REQUIRED_EMAIL);
  }
  if (!password) {
    throw CreateError(ErrorCodes.REQUIRED_PASSWORD);
  }
  if (!IsValidEmail(email)) {
    throw CreateError(ErrorCodes.INVALID_EMAIL_FORMAT);
  }
  if (password.length < 6) {
    throw CreateError(ErrorCodes.INVALID_PASSWORD_FORMAT);
  }
};

export function IsJsonString(string) {
  try {
    JSON.parse(string);
    return true;
  } catch (e) {
    return false;
  }
}

export function isUUID(str) {
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  return uuidRegex.test(str);
}
