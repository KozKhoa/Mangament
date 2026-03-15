import api from "@/lib/axios";
import axios from "axios";
import qs from "qs";
import { StoryParams } from "@/types/params";
import Story from "@/types/story";

type Pagination = { page: number; pageSize: number; totalItems: number; totalPages: number };
type ServiceResult<T> = { success: boolean; data?: T; message?: string; pagination?: Pagination };

export async function getStoryById(storyId: string, params: StoryParams): Promise<ServiceResult<Story>> {
  try {
    if (!storyId) throw new Error("Require id");

    const res = await api.get(`/stories/${storyId}`, {
      params: params,
      paramsSerializer: (params) => qs.stringify(params, { arrayFormat: "comma" }),
    });
    return res.data;
  } catch (error: any) {
    console.log(error);
    return { success: false, message: error?.response?.data?.message || error?.message || "Unknown error" };
  }
}

export async function getStoryByTitle(title: string, params: StoryParams): Promise<ServiceResult<Story>> {
  try {
    if (!title) throw new Error("Require title");

    const res = await api.get(`/stories/title/${title}`, {
      params: params,
      paramsSerializer: (params) => qs.stringify(params, { arrayFormat: "comma" }),
    });
    return res.data;
  } catch (error: any) {
    console.log(error);
    return { success: false, message: error?.response?.data?.message || error?.message || "Unknown error" };
  }
}

export async function getStories(params?: StoryParams): Promise<ServiceResult<Story[]>> {
  try {
    const res = await api.get(`/stories/`, {
      params: params,
      paramsSerializer: (params) => qs.stringify(params, { arrayFormat: "comma" }),
    });
    return res.data;
  } catch (error: any) {
    console.log(error);
    return { success: false, message: error?.response?.data?.message || error?.message || "Unknown error" };
  }
}

export async function getReview(storyId: string): Promise<ServiceResult<string[]>> {
  try {
    const res = await api.get(`/stories/${storyId}/review`);

    return res.data;
  } catch (error: any) {
    console.log(error);
    return { success: false, message: error?.response?.data?.message || error?.message || "Unknown error" };
  }
}

export async function getRandomStory(): Promise<ServiceResult<Story>> {
  try {
    const res = await api.get(`/stories/random`);
    return res.data;
  } catch (error: any) {
    console.log(error);
    return { success: false, message: error?.response?.data?.message || error?.message || "Unknown error" };
  }
}

export async function countStories(params?: StoryParams): Promise<ServiceResult<number>> {
  try {
    const res = await api.get("/stories/count", {
      params: params,
      paramsSerializer: (params) => qs.stringify(params, { arrayFormat: "comma" }),
    });
    return res.data;
  } catch (error: any) {
    console.log(error);
    return { success: false, message: error?.response?.data?.message || error?.message || "Unknown error" };
  }
}

export async function addOneView(storyId: string) {
  try {
    const res = await api.patch(`/stories/${storyId}/view`);
    return res.data;
  } catch (error: any) {
    console.log(error);
    return { success: false, message: error?.response?.data?.message || error?.message || "Unknown error" };
  }
}

const storyService = { getStoryById, getStoryByTitle, getRandomStory, getReview, getStories, countStories, addOneView };

export default storyService;
