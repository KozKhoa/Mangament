import api from "@/lib/axios";
import axios from "axios";

export default async function post(storyId: string, userId: string, star: number, message: string) {
  try {
    const res = await api.post(`/stories/${storyId ?? ""}/ratings`, {
      userId: userId,
      star: star,
      message: message,
    });
    return res.data;
  } catch (error) {
    if (axios.isAxiosError(error)) {
      return error?.response?.data;
    }
    return error;
  }
}
