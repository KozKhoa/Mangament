import api from "@/lib/axios";
import User from "@/types/user";
import axios from "axios";

export default async function update(user: User) {
  let res;
  try {
    res = await api.put("/users/me", user);
    return res.data;
  } catch (error: unknown) {
    if (axios.isAxiosError(error)) {
      return error?.response?.data;
    }
    return error;
  }
}
