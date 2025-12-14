import api from "@/lib/axios";
import axios from "axios";

export default async function logout() {
  try {
    const res = await api.post("/auth/logout");
    return res.data;
  } catch (error) {
    if (axios.isAxiosError(error)) {
      return error?.response?.data;
    }
    return error;
  }
}
