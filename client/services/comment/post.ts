import api from "@/lib/axios";
import axios from "axios";

export async function postStoryComment(storyId: string, userId: string, message: string) {
  try {
    const res = await api.post(`/stories/${storyId ?? ""}/comments`, {
      userId: userId,
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

export async function postStoryNodeComment(storyNodeId: string, userId: string, message: string) {
  try {
    const res = await api.post(`/story-nodes/${storyNodeId ?? ""}/comments`, {
      userId: userId,
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
