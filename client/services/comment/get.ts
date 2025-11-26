import api from "@/lib/axios";
import { CommentParams } from "@/types/params";
import axios from "axios";
import qs from "qs";

export async function getStoryComments(storyId: string, params: CommentParams) {
  try {
    const res = await api.get(`/stories/${storyId ?? ""}/comments`, {
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

export async function getStoryNodeComments(storyNodeId: string, params: CommentParams) {
  try {
    const res = await api.get(`/story-nodes/${storyNodeId ?? ""}/comments`, {
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
export async function countStoryComment(storyId: string) {
  try {
    const res = await api.get(`/stories/${storyId ?? ""}/comments/count`);
    return res.data;
  } catch (error) {
    if (axios.isAxiosError(error)) {
      return error?.response?.data;
    }
    return error;
  }
}

export async function countStoryNodeComment(storyNodeId: string) {
  try {
    const res = await api.get(`/story-nodes/${storyNodeId ?? ""}/comments/count`);
    return res.data;
  } catch (error) {
    if (axios.isAxiosError(error)) {
      return error?.response?.data;
    }
    return error;
  }
}
