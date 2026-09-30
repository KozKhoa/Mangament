import api from "@/lib/axios";
import { handleAxiosError } from "@/utils/error";
import { DashboardOverview, DashboardStatsNewUsers, DashboardStatsView } from "@/types/dashboard";
import { GetStatsNewUsersParams, GetStatsViewParams, ServiceResult } from "./types";

export async function getOverview(): Promise<ServiceResult<DashboardOverview>> {
  try {
    const res = await api.get("/admin/dashboard/overview");
    return res.data;
  } catch (error: unknown) {
    return handleAxiosError(error);
  }
}

export async function getStatsView({
  from,
  to,
  storyId,
  groupBy = "day",
}: GetStatsViewParams): Promise<ServiceResult<DashboardStatsView[]>> {
  try {
    const res = await api.get(
      `/admin/dashboard/stats/views?fromDate=${from.toISOString()}&toDate=${to.toISOString()}&groupBy=${groupBy}${storyId ? `&storyId=${storyId}` : ""}`,
    );
    return res.data;
  } catch (error: unknown) {
    return handleAxiosError(error);
  }
}

export async function getStatsNewUsers({
  from,
  to,
  groupBy = "day",
}: GetStatsNewUsersParams): Promise<ServiceResult<DashboardStatsNewUsers[]>> {
  try {
    const res = await api.get(`/admin/dashboard/stats/new-users`, {
      params: {
        fromDate: from.toISOString(),
        toDate: to.toISOString(),
        groupBy: groupBy,
      },
    });
    return res.data;
  } catch (error: unknown) {
    return handleAxiosError(error);
  }
}
