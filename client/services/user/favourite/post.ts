import api from "@/lib/axios";
import axios from "axios";

export default async function post(body: { storyId: string }) {
  try {
    const res = await api.post("/users/me/favourites", {
      storyId: body.storyId,
    });
    return res.data;
  } catch (error) {
    if (axios.isAxiosError(error)) {
      return error?.response?.data;
    }
    return error;
  }
}
