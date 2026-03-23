export function CreateError(status = 500, message = "Internal server error") {
  const err = new Error(message);
  err.success = false;
  err.status = status || 500;
  return err;
}
