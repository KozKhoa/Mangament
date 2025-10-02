export const CreateError = (error = ErrorCodes.INTERNAL_SERVER_ERROR) => {
  const err = new Error(error.message);
  err.success = false;
  err.status = error.status;
  return err;
};
