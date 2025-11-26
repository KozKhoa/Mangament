import api from "@/lib/axios";
import axios from "axios";
import qs from "qs";
import { StoryParams } from "@/types/params";

export default async function count(params?: StoryParams) {
  try {
    const res = await api.get("/stories/count", {
      params: params,
      paramsSerializer: (params) => qs.stringify(params, { arrayFormat: "comma" }),
    });
    return res.data;
  } catch (error) {
    if (axios.isAxiosError(error)) {
      return error?.response?.data;
    }
    return error;
  }
}
