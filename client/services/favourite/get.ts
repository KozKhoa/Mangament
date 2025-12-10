import api from "@/lib/axios";
import { FavoureiteParams } from "@/types/params";
import axios from "axios";
import qs from "qs";

export default async function get(params: FavoureiteParams) {
  try {
    const res = await api.get("/users/me/favourites", { params: params, paramsSerializer: (params) => qs.stringify(params, { arrayFormat: "comma" }) });
    return res.data;
  } catch (error) {
    if (axios.isAxiosError(error)) {
      return error?.response?.data;
    }
    return error;
  }
}
