import api from "@/lib/axios";
import axios from "axios";
import qs from "qs";

export async function addOneView(storyId: string) {
  try {
    const res = await api.patch(`/stories/${storyId}/view`);
    return res.data;
  } catch (error) {
    if (axios.isAxiosError(error)) {
      return error?.response?.data;
    }
    return error;
  }
}
