import { HistoryParams } from "@/types/params";
import api from "@/lib/axios";
import qs from "qs";
import History from "@/types/history";
import { Pagination } from "@/types/pagination";

type ServiceResult<T> = { success: boolean; data?: T; message?: string; pagination?: Pagination };

export async function getHistories({ page = 1, limit = 10, sort = "created_at:desc", fromDate, toDate }: HistoryParams): Promise<ServiceResult<History[]>> {
  console.log(fromDate, toDate);
  try {
    const res = await api.get(`/histories/user/me`, {
      params: {
        page,
        limit,
        sort,
        ...(fromDate && { fromDate: fromDate }),
        ...(toDate && { toDate: toDate }),
      },
      paramsSerializer: (params) => qs.stringify(params, { arrayFormat: "comma" }),
    });
    return res.data;
  } catch (error: any) {
    console.error(error);
    return { success: false, message: error?.response?.data?.message || error?.message || "Unknown error" };
  }
}

export async function addHistory(storyId: string, storyNodeId: string): Promise<ServiceResult<History>> {
  try {
    const res = await api.post(`/histories/story/${storyId}/story-node/${storyNodeId}`);
    return res.data;
  } catch (error: any) {
    console.error(error);
    return { success: false, message: error?.response?.data?.message || error?.message || "Unknown error" };
  }
}

export async function removeHistory(historyId: string): Promise<ServiceResult<History>> {
  try {
    const res = await api.delete(`/histories/${historyId}`);
    return res.data;
  } catch (error: any) {
    console.error(error);
    return { success: false, message: error?.response?.data?.message || error?.message || "Unknown error" };
  }
}

const historyService = { getHistories, addHistory, removeHistory };

export default historyService;
