import api from "@/lib/axios";
import axios from "axios";

export default async function remove(id: string) {
  try {
    const res = await api.delete(`/users/me/favourites/${id}`);
    return res.data;
  } catch (error) {
    if (axios.isAxiosError(error)) {
      return error?.response?.data;
    }
    return error;
  }
}
