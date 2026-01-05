import api from "@/lib/axios";
import axios from "axios";

export async function forgotPassword(email: string) {
  try {
    const res = await api.post("/auth/forgot-password", { email });

    return await res.data;
  } catch (error) {
    console.log(error);
    if (axios.isAxiosError(error)) {
      return error?.response?.data;
    }
    return error;
  }
}

export async function resetPassword(email: string, otp: string) {
  try {
    const res = await api.post("/auth/reset-password", { email, otp });

    return await res.data;
  } catch (error) {
    console.log(error);
    if (axios.isAxiosError(error)) {
      return error?.response?.data;
    }
    return error;
  }
}
