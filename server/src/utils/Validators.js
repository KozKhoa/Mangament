import { CreateError } from "../configs/ErrorHandle.js";
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
