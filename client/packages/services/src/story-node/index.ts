import api from "@/lib/axios";
import { handleAxiosError } from "@/utils/error";
import qs from "qs";
import { StoryNodeParams } from "@/types/params";
import StoryNode from "@/types/story-node";

type Pagination = {
  page: number;
  pageSize: number;
  totalItems: number;
  totalPages: number;
};
type ServiceResult<T> = { success: boolean; data?: T; message?: string; pagination?: Pagination };

export async function getStoryNodeById(storyNodeId: string, params: StoryNodeParams): Promise<ServiceResult<StoryNode>> {
  try {
    if (!storyNodeId) throw new Error("Require id");

    const res = await api.get(`/story-nodes/${storyNodeId}`, {
      params: params,
      paramsSerializer: (params) => qs.stringify(params, { arrayFormat: "comma" }),
    });
    return res.data;
  } catch (error: unknown) {
    return handleAxiosError(error);
  }
}

export async function addOneView(storyNodeId: string): Promise<ServiceResult<number>> {
  try {
    if (!storyNodeId) throw new Error("Story node id is required");

    const res = await api.patch(`/story-nodes/${storyNodeId}/view`);
    return res.data;
  } catch (error: unknown) {
    return handleAxiosError(error);
  }
}

const storyNodeService = { getStoryNodeById, addOneView };

export default storyNodeService;
