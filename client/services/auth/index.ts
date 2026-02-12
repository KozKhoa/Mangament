import api from "@/lib/axios";
import axios from "axios";
import { Pagination } from "@/types/pagination";
import User from "@/types/user";

type ServiceResult<T> = { success: boolean; data?: T; message?: string; pagination?: Pagination };

export async function me(): Promise<ServiceResult<User>> {
  try {
    const res = await api.get("/auth/me");
    return res.data;
  } catch (error) {
    console.error(error);
    return { success: false, message: error?.toString() };
  }
}

export async function register(name: string, email: string, password: string): Promise<ServiceResult<{ accessToken: string; user: User }>> {
  try {
    const res = await api.post("/auth/register", { name, email, password });

    return res.data;
  } catch (error) {
    console.error(error);
    return { success: false, message: error?.toString() };
  }
}

export async function login(email: string, password: string): Promise<ServiceResult<{ accessToken: string; user: User }>> {
  try {
    const res = await api.post("/auth/login", { email, password });
    return res.data;
  } catch (error) {
    console.error(error);
    return { success: false, message: error?.toString() };
  }
}

export async function logout(): Promise<ServiceResult<any[]>> {
  try {
    const res = await api.post("/auth/logout");
    return res.data;
  } catch (error) {
    console.error(error);
    return { success: false, message: error?.toString() };
  }
}

export async function refresh(): Promise<ServiceResult<{ token: string; user: User }>> {
  try {
    const res = await axios.post(
      `${process.env.NEXT_PUBLIC_API_URL}/auth/refresh`,
      {},
      { withCredentials: true }, // gửi cookie refresh token
    );
    return res.data;
  } catch (error) {
    console.error(error);
    return { success: false, message: error?.toString() };
  }
}

export async function forgotPassword(email: string): Promise<ServiceResult<any>> {
  try {
    const res = await api.post("/auth/forgot-password", { email });

    return await res.data;
  } catch (error) {
    console.error(error);
    return { success: false, message: error?.toString() };
  }
}

export async function resetPassword(email: string, otp: string): Promise<ServiceResult<any>> {
  try {
    const res = await api.post("/auth/reset-password", { email, otp });

    return await res.data;
  } catch (error) {
    console.error(error);
    return { success: false, message: error?.toString() };
  }
}

const authService = { me, login, register, logout, forgotPassword, resetPassword };

export default authService;
