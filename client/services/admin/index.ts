import api from "@/lib/axios";
import axios from "axios";
import { Pagination } from "@/types/pagination";
import User from "@/types/user";
import { DashboardOverview, DashboardStatsNewUsers, DashboardStatsView } from "@/types/dashboard";

type ServiceResult<T> = { success: boolean; data?: T; message?: string; pagination?: Pagination };

export async function getOverview(): Promise<ServiceResult<DashboardOverview>> {
  try {
    const res = await api.get("/admin/dashboard/overview");
    return res.data;
  } catch (error) {
    console.error(error);
    return { success: false, message: error?.toString() };
  }
}

export async function getStatsView({
  from,
  to,
  storyId,
  groupBy = "day",
}: {
  from: Date;
  to: Date;
  storyId?: string;
  groupBy?: string;
}): Promise<ServiceResult<DashboardStatsView[]>> {
  try {
    const res = await api.get(
      `/admin/dashboard/stats/views?fromDate=${from.toISOString()}&toDate=${to.toISOString()}&groupBy=${groupBy}${storyId ? `&storyId=${storyId}` : ""}`,
    );
    return res.data;
  } catch (error) {
    console.error(error);
    return { success: false, message: error?.toString() };
  }
}

export async function getStatsNewUsers({
  from,
  to,
  groupBy = "day",
}: {
  from: Date;
  to: Date;
  groupBy?: string;
}): Promise<ServiceResult<DashboardStatsNewUsers[]>> {
  try {
    const res = await api.get(`/admin/dashboard/stats/new-users?fromDate=${from.toISOString()}&toDate=${to.toISOString()}&groupBy=${groupBy}`);
    return res.data;
  } catch (error) {
    console.error(error);
    return { success: false, message: error?.toString() };
  }
}
const adminService = { getOverview, getStatsView, getStatsNewUsers };

export default adminService;
