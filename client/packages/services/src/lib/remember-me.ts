export function turnOn() {
  return localStorage.setItem("rememberMe", "true");
}

export function turnOff() {
  return localStorage.removeItem("rememberMe");
}

export function getStatus() {
  return localStorage.getItem("rememberMe") === "true";
}
