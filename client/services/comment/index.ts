import api from "@/lib/axios";
import Comment from "@/types/comment";
import { Pagination } from "@/types/pagination";
import { CommentParams } from "@/types/params";
import axios from "axios";
import qs from "qs";

type ServiceResult<T> = { success: boolean; data?: T; message?: string; pagination?: Pagination };

export async function getStoryComments(storyId: string, params: CommentParams): Promise<ServiceResult<Comment[]>> {
  try {
    const res = await api.get(`/comments/story/${storyId ?? ""}`, {
      params: params,
      paramsSerializer: (params) => qs.stringify(params, { arrayFormat: "comma" }),
    });
    return res.data;
  } catch (error) {
    console.error(error);
    return { success: false, message: error?.toString() };
  }
}

export async function getStoryNodeComments(storyId: string, storyNodeId: string, params?: CommentParams): Promise<ServiceResult<Comment[]>> {
  try {
    const res = await api.get(`/comments/story/${storyId}/story-node/${storyNodeId}`, {
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
    const res = await api.post(`/comments/story/${storyId}`, { title, content });
    return res.data;
  } catch (error) {
    console.error(error);
    return { success: false, message: error?.toString() };
  }
}

export async function postStoryNodeComment(storyId: string, storyNodeId: string, title: string, content: string): Promise<ServiceResult<Comment>> {
  try {
    const res = await api.post(`/comments/story/${storyId}/story-node/${storyNodeId}`, { title, content });
    return res.data;
  } catch (error) {
    console.error(error);
    return { success: false, message: error?.toString() };
  }
}

export async function deleteComment(id: string): Promise<ServiceResult<null>> {
  try {
    const res = await api.delete(`/comments/${id}`);
    return res.data;
  } catch (error) {
    console.error(error);
    return { success: false, message: error?.toString() };
  }
}

const commentService = { getStoryComments, getStoryNodeComments, postStoryComment, postStoryNodeComment, deleteComment };

export default commentService;
