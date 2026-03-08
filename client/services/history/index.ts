import { HistoryParams } from "@/types/params";
import api from "@/lib/axios";
import axios from "axios";
import qs from "qs";
import History from "@/types/history";
import { Pagination } from "@/types/pagination";

type ServiceResult<T> = { success: boolean; data?: T; message?: string; pagination?: Pagination };

export async function getHistories(params: HistoryParams): Promise<ServiceResult<History[]>> {
  try {
    const res = await api.get("/users/me/histories", { params: params, paramsSerializer: (params) => qs.stringify(params, { arrayFormat: "comma" }) });
    return res.data;
  } catch (error) {
    console.error(error);
    return { success: false, message: error?.toString() };
  }
}

export async function addHistory(storyId: string, storyNodeId: string): Promise<ServiceResult<History>> {
  try {
    const res = await api.post("/users/me/histories", { storyId, storyNodeId });
    return res.data;
  } catch (error) {
    console.error(error);
    return { success: false, message: error?.toString() };
  }
}

export async function removeHistory(historyId: string): Promise<ServiceResult<History>> {
  try {
    const res = await api.delete(`/users/me/histories/${historyId}`);
    return res.data;
  } catch (error) {
    console.error(error);
    return { success: false, message: error?.toString() };
  }
}

const historyService = { getHistories, addHistory, removeHistory };

export default historyService;
