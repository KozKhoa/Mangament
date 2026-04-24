const ACCESS_TOKEN = "accessToken";

export function getAccessToken() {
  if (typeof window === "undefined") return "";
  return localStorage.getItem(ACCESS_TOKEN);
}

export function setAccessToken(accessToken: string) {
  if (typeof window === "undefined") return;
  return localStorage.setItem(ACCESS_TOKEN, accessToken);
}

export function removeAccessToken() {
  if (typeof window === "undefined") return;
  return localStorage.removeItem(ACCESS_TOKEN);
}
