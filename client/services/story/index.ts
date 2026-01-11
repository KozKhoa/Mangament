import api from "@/lib/axios";
import axios from "axios";
import qs from "qs";
import { StoryParams } from "@/types/params";
import Story from "@/types/story";

type Pagination = { page: number; pageSize: number; totalItems: number; totalPages: number };
type ServiceResult<T> = { success: boolean; data?: T; message?: any; pagination?: Pagination };

export async function getStory(params: StoryParams): Promise<ServiceResult<Story>> {
  try {
    if (!params.id) throw new Error("Require id");

    const res = await api.get(`/stories/${params.id}`, {
      params: params,
      paramsSerializer: (params) => qs.stringify(params, { arrayFormat: "comma" }),
    });
    return res.data;
  } catch (error) {
    console.log(error);
    if (axios.isAxiosError(error)) {
      return { success: false, message: error?.response?.data };
    }
    return { success: false, message: error };
  }
}

export async function getStories(params?: StoryParams): Promise<ServiceResult<Story[]>> {
  try {
    const res = await api.get(`/stories/`, {
      params: params,
      paramsSerializer: (params) => qs.stringify(params, { arrayFormat: "comma" }),
    });
    return res.data;
  } catch (error) {
    console.log(error);
    if (axios.isAxiosError(error)) {
      return { success: false, message: error?.response?.data };
    }
    return { success: false, message: error };
  }
}

export async function getReview(storyId: string): Promise<ServiceResult<string[]>> {
  try {
    const res = await api.get(`/stories/${storyId}/review`);

    return res.data;
  } catch (error) {
    console.log(error);
    if (axios.isAxiosError(error)) {
      return { success: false, message: error?.response?.data };
    }
    return { success: false, message: error };
  }
}

export async function getRandomStory(): Promise<ServiceResult<Story>> {
  try {
    const res = await api.get(`/stories/random`);
    return res.data;
  } catch (error) {
    console.log(error);
    if (axios.isAxiosError(error)) {
      return { success: false, message: error?.response?.data };
    }
    return { success: false, message: error };
  }
}

export async function countStories(params?: StoryParams): Promise<ServiceResult<number>> {
  try {
    const res = await api.get("/stories/count", {
      params: params,
      paramsSerializer: (params) => qs.stringify(params, { arrayFormat: "comma" }),
    });
    return res.data;
  } catch (error) {
    console.log(error);
    if (axios.isAxiosError(error)) {
      return { success: false, message: error?.response?.data };
    }
    return { success: false, message: error };
  }
}

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

const storyService = { getStory, getRandomStory, getReview, getStories, countStories, addOneView };

export default storyService;
