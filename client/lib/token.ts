const ACCESS_TOKEN = "accessToken";

export function getAccessToken() {
  return localStorage.getItem(ACCESS_TOKEN);
}

export function setAccessToken(accessToken: string) {
  return localStorage.setItem(ACCESS_TOKEN, accessToken);
}

export function removeAccessToken() {
  return localStorage.removeItem(ACCESS_TOKEN);
}
