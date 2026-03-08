import api from "@/lib/axios";
import axios from "axios";

export default async function get(number?: number | null) {
  let res;
  try {
    res = await api.get("/authors", {
      params: {
        page: 1,
        limit: number ?? 2147483647,
      },
    });
    return res.data;
  } catch (error) {
    if (axios.isAxiosError(error)) {
      return error?.response?.data;
    }
    return error;
  }
}
