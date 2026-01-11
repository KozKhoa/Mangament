import api from "@/lib/axios";
import axios from "axios";
import qs from "qs";
import { StoryNodeParams } from "@/types/params";
import StoryNode from "@/types/story-node";

type Pagination = {
  page: number;
  pageSize: number;
  totalItems: number;
  totalPages: number;
};
type ServiceResult<T> = {
  success: boolean;
  data?: T;
  message?: any;
  pagination?: Pagination;
};

export async function getStoryNode(params: StoryNodeParams): Promise<ServiceResult<StoryNode>> {
  try {
    if (!params.id) throw new Error("Require id");

    const res = await api.get(`/story-nodes/${params.id}`, {
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

export async function addOneView(storyNodeId: string): Promise<ServiceResult<number>> {
  try {
    if (!storyNodeId) throw new Error("Story node id is required");

    const res = await api.patch(`/story-nodes/${storyNodeId}/view`);
    return res.data;
  } catch (error) {
    console.log(error);
    if (axios.isAxiosError(error)) {
      return { success: false, message: error?.response?.data };
    }
    return { success: false, message: error };
  }
}

const storyNodeService = { getStoryNode, addOneView };

export default storyNodeService;
