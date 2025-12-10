import { HistoryParams } from "@/types/params";
import api from "@/lib/axios";
import axios from "axios";
import qs from "qs";

export default async function get(params: HistoryParams) {
  try {
    const res = await api.get("/users/me/histories", { params: params, paramsSerializer: (params) => qs.stringify(params, { arrayFormat: "comma" }) });
    return res.data;
  } catch (error) {
    if (axios.isAxiosError(error)) {
      return error?.response?.data;
    }
    return error;
  }
}
