const ACCESS_TOKEN = "accessToken";

export function getAccessToken(): string {
  if (typeof window === "undefined") return "";

  // 1. Try localStorage
  const localToken = localStorage.getItem(ACCESS_TOKEN);
  if (localToken) return localToken;

  // 2. Try cookie (supports cross-subdomain SSO)
  try {
    const match = document.cookie.match(new RegExp("(^| )" + ACCESS_TOKEN + "=([^;]+)"));
    return match ? decodeURIComponent(match[2]) : "";
  } catch {
    return "";
  }
}

export function setAccessToken(accessToken: string): void {
  if (typeof window === "undefined") return;

  try {
    localStorage.setItem(ACCESS_TOKEN, accessToken);
  } catch (e) {
    console.warn("Could not save token to localStorage:", e);
  }

  try {
    const domain = process.env.NEXT_PUBLIC_COOKIE_DOMAIN;
    const domainAttr = domain ? `; domain=${domain}` : "";
    document.cookie = `${ACCESS_TOKEN}=${encodeURIComponent(accessToken)}; path=/${domainAttr}; SameSite=Lax`;
  } catch (e) {
    console.warn("Could not save token to cookie:", e);
  }
}

export function removeAccessToken(): void {
  if (typeof window === "undefined") return;

  try {
    localStorage.removeItem(ACCESS_TOKEN);
  } catch (e) {
    console.warn("Could not remove token from localStorage:", e);
  }

  try {
    const domain = process.env.NEXT_PUBLIC_COOKIE_DOMAIN;
    const domainAttr = domain ? `; domain=${domain}` : "";
    document.cookie = `${ACCESS_TOKEN}=; path=/${domainAttr}; max-age=0; SameSite=Lax`;
  } catch (e) {
    console.warn("Could not remove token from cookie:", e);
  }
}
