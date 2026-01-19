import api from "@/lib/axios";
import Comment from "@/types/comment";
import { Pagination } from "@/types/pagination";
import { CommentParams } from "@/types/params";
import axios from "axios";
import qs from "qs";

type ServiceResult<T> = { success: boolean; data?: T; message?: string; pagination?: Pagination };

export async function getStoryComments(storyId: string, params: CommentParams): Promise<ServiceResult<Comment[]>> {
  try {
    const res = await api.get(`/stories/${storyId ?? ""}/comments`, {
      params: params,
      paramsSerializer: (params) => qs.stringify(params, { arrayFormat: "comma" }),
    });
    return res.data;
  } catch (error) {
    console.error(error);
    return { success: false, message: error?.toString() };
  }
}

export async function getStoryNodeComments(storyNodeId: string, params?: CommentParams): Promise<ServiceResult<Comment[]>> {
  try {
    const res = await api.get(`/story-nodes/${storyNodeId}/comments`, {
      ...(params && {
        params: params,
        paramsSerializer: (params) => qs.stringify(params, { arrayFormat: "comma" }),
      }),
    });
    return res.data;
  } catch (error) {
    console.error(error);
    return { success: false, message: error?.toString() };
  }
}

export async function postStoryComment(storyId: string, title: string, content: string): Promise<ServiceResult<Comment>> {
  try {
    const res = await api.post(`/stories/${storyId ?? ""}/comments`, { title, content });
    return res.data;
  } catch (error) {
    console.error(error);
    return { success: false, message: error?.toString() };
  }
}

export async function postStoryNodeComment(storyNodeId: string, title: string, content: string): Promise<ServiceResult<Comment>> {
  try {
    const res = await api.post(`/story-nodes/${storyNodeId ?? ""}/comments`, { title, content });
    return res.data;
  } catch (error) {
    console.error(error);
    return { success: false, message: error?.toString() };
  }
}

const commentService = { getStoryComments, getStoryNodeComments, postStoryComment, postStoryNodeComment };

export default commentService;
