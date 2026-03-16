import axios, { AxiosError } from "axios";

import * as token from "@/lib/token";

// Create instance
const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL,
  timeout: 20000,
});

// Auto add access token to every request
api.interceptors.request.use(
  (config) => {
    const accessToken = token.getAccessToken();

    if (accessToken) {
      config.headers.Authorization = `Bearer ${accessToken}`;
    }

    // Gắn API KEY vào headers
    config.headers["x-api-key"] = process.env.API_KEY;

    return config;
  },
  (error) => Promise.reject(error),
);

let isRefreshing = false;
let refreshQueue: any[] = [];

function processRefreshQueue(error: any, accessToken: string | null) {
  refreshQueue.forEach((prom) => {
    if (error) prom.reject(error);
    else prom.resolve(accessToken);
  });

  refreshQueue = [];
}

// If access token is expired
api.interceptors.response.use(
  (response) => {
    return response;
  },
  async (error) => {
    const originalRequest = error.config;

    // If status code is 401 and there are no request being rejected by token expired before
    if (error.response?.status === 401 && !originalRequest?._retry) {
      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          refreshQueue.push({ resolve, reject });
        }).then((accessToken) => {
          originalRequest.headers.Authorization = `Bearer ${accessToken}`;
          return api(originalRequest);
        });
      }

      originalRequest._retry = true;

      try {
        // Call api refresh token
        const res = await axios.post(
          `${process.env.NEXT_PUBLIC_API_URL}/auth/refresh`,
          {},
          { withCredentials: true }, // gửi cookie refresh token
        );

        const newAccessToken = res.data.data.accessToken;

        processRefreshQueue(null, newAccessToken);

        token.setAccessToken(newAccessToken);

        // Cập nhật token mới và gửi lại request cũ
        originalRequest.headers.Authorization = `Bearer ${newAccessToken}`;
        return axios(originalRequest);
      } catch (error: unknown) {
        console.warn("Refresh token failed:", error);
        processRefreshQueue(error, null);
        token.removeAccessToken();
      }
    }

    return Promise.reject(error);
  },
);

export default api;
