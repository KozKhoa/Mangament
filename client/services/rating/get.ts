import api from "@/lib/axios";
import axios from "axios";
import qs from "qs";

import { RatingParams } from "@/types/params";

export async function get(storyId: string, params: RatingParams) {
  try {
    const res = await api.get(`/stories/${storyId ?? ""}/ratings`, {
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

export async function count(storyId: string, params: RatingParams) {
  try {
    const res = await api.get(`/stories/${storyId ?? ""}/ratings/count`, {
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
