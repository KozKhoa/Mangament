import api from "@/lib/axios";
import axios from "axios";

export default async function get() {
  let res;
  try {
    res = await api.get("/genres", {});
    return res.data;
  } catch (error) {
    if (axios.isAxiosError(error)) {
      return error?.response?.data;
    }
    return error;
  }
}
