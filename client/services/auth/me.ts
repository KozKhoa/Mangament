import api from "@/lib/axios";
import axios from "axios";

export default async function me() {
  try {
    const res = await api.get("/auth/me");
    return res.data;
  } catch (error: unknown) {
    if (axios.isAxiosError(error)) {
      return error?.response?.data;
    }
    return error;
  }
}
