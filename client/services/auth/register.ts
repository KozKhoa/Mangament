import api from "@/lib/axios";
import axios from "axios";

export default async function register(
  name: string,
  email: string,
  password: string
) {
  try {
    const res = await api.post("/auth/register", { name, email, password });
    console.log(res);
    return res.data;
  } catch (error) {
    console.log(error);
    if (axios.isAxiosError(error)) {
      return error?.response?.data;
    }
    return error;
  }
}
