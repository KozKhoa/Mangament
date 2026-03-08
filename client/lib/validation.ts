export function validateEmailFormat(email: string) {
  const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return re.test(email);
}

export function validatePasswordFormat(password: string) {
  return password.length >= 6;
}
