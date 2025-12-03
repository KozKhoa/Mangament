import api from "@/lib/axios";
import axios from "axios";

export default async function get(params: { limit: number; page: number; sort: string }) {
  try {
    const res = await api.get("/users/me/favourites", { params: params });
    return res.data;
  } catch (error) {
    if (axios.isAxiosError(error)) {
      return error?.response?.data;
    }
    return error;
  }
}
