import api from "@/lib/axios";
import axios from "axios";
import qs from "qs";
import { StoryNodeParams } from "@/types/params";

export default async function get(id: string, params?: StoryNodeParams) {
  try {
    const res = await api.get(`/story-nodes/${id}`, {
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
