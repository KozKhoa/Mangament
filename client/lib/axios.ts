import axios, { AxiosError } from "axios";

import * as token from "@/lib/token";

// Create instance
const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL,
  timeout: 1000,
});

// Auto add access token to every request
api.interceptors.request.use(
  (config) => {
    const accessToken = token.getAccessToken();
    if (accessToken) {
      config.headers.Authorization = `Bearer ${accessToken}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// If access token is expired
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    // If status code is 401 and there are no request being rejected by token expired before
    if (error.response?.status === 401 && !originalRequest?._retry) {
      originalRequest._retry = true;

      try {
        // Call api refresh token
        const res = await axios.post(
          `${process.env.NEXT_PUBLIC_API_URL}auth/refresh`,
          {},
          { withCredentials: true } // gửi cookie refresh token
        );

        const newAccessToken = res.data.data.token;
        console.log(newAccessToken);
        token.setAccessToken(newAccessToken);

        // Cập nhật token mới và gửi lại request cũ
        originalRequest.headers.Authorization = `Bearer ${newAccessToken}`;
        return api(originalRequest);
      } catch (error: unknown) {
        console.warn("Refresh token failed:", error);
        token.removeAccessToken();
      }
    }

    return Promise.reject(error);
  }
);

export default api;
