import api from "@/lib/axios";
import axios from "axios";

export default async function post(storyId: string, storyNodeId: string) {
  try {
    const res = await api.post("/users/me/histories", { storyId, storyNodeId });
    return res.data;
  } catch (error) {
    if (axios.isAxiosError(error)) {
      return error?.response?.data;
    }
    return error;
  }
}
