import api from "@/lib/axios";
import axios from "axios";

export default async function login(email: string, password: string) {
  let res;
  try {
    res = await api.post("/auth/login", {
      email,
      password,
    });
    return res.data;
  } catch (error: unknown) {
    if (axios.isAxiosError(error)) {
      return error?.response?.data;
    }
    return error;
  }
}
