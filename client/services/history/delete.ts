import { HistoryParams } from "@/types/params";
import api from "@/lib/axios";
import axios from "axios";

export default async function remove(historyId: string) {
  try {
    const res = await api.delete(`/users/me/histories/${historyId}`);
    return res.data;
  } catch (error) {
    if (axios.isAxiosError(error)) {
      return error?.response?.data;
    }
    return error;
  }
}
