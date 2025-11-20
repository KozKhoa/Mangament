import api from "@/lib/axios";
import axios from "axios";
import qs from "qs";
import { StoryParams } from "@/types/params";

export default async function get(params?: StoryParams) {
  try {
    const res = await api.get(`/stories/${params?.id ?? ""}`, {
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
