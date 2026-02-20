import api from "@/lib/axios";
import qs from "qs";
import axios from "axios";
import { Pagination } from "@/types/pagination";
import User from "@/types/user";
import { DashboardOverview, DashboardStatsNewUsers, DashboardStatsView } from "@/types/dashboard";
import Story from "@/types/story";
import { StoryParams } from "@/types/params";

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
    const res = await api.get(`/admin/dashboard/stats/new-users`, {
      params: {
        fromDate: from.toISOString(),
        toDate: to.toISOString(),
        groupBy: groupBy,
      },
    });
    return res.data;
  } catch (error) {
    console.error(error);
    return { success: false, message: error?.toString() };
  }
}

export async function getUsers({
  search,
  page = 1,
  limit = 10,
  joinDate,
  genders,
  roles,
  isBanned,
  sort,
}: {
  page?: number;
  limit?: number;
  search?: string;
  joinDate?: { from?: Date; to?: Date };
  genders?: string[];
  roles?: string[];
  isBanned?: boolean;
  sort?: string;
}): Promise<ServiceResult<User[]>> {
  try {
    const res = await api.get(`/admin/users`, {
      params: {
        page: page,
        limit: limit,
        search: search,
        fromDate: joinDate?.from,
        toDate: joinDate?.to,
        gender: genders,
        role: roles,
        isBanned: isBanned,
        sort: sort,
      },
      paramsSerializer: (params) => qs.stringify(params, { arrayFormat: "comma" }),
    });
    return res.data;
  } catch (error) {
    console.log(error);
    return { success: false, message: error?.toString() };
  }
}

export async function updateUser({ userId, name, role }: { userId: string; name?: string; role?: string }): Promise<ServiceResult<User>> {
  try {
    const res = await api.put(`/admin/users/${userId}`, { name, role });
    return res.data;
  } catch (error) {
    console.log(error);
    return { success: false, message: error?.toString() };
  }
}

export async function banUser({ userId, isBanned }: { userId: string; isBanned: boolean }): Promise<ServiceResult<null>> {
  try {
    const res = await api.patch(`/admin/users/${userId}/ban`, {
      isBanned: isBanned,
    });
    return res.data;
  } catch (error) {
    console.log(error);
    return { success: false, message: error?.toString() };
  }
}

export async function deleteUser(userId: string): Promise<ServiceResult<null>> {
  try {
    const res = await api.delete(`/admin/users/${userId}`);
    return res.data;
  } catch (error) {
    console.log(error);
    return { success: false, message: error?.toString() };
  }
}

export async function getStory(storyId: string): Promise<ServiceResult<Story>> {
  try {
    const res = await api.get(`/admin/stories/${storyId}`);
    return res.data;
  } catch (error) {
    console.log(error);
    return { success: false, message: error?.toString() };
  }
}

export async function getStories(params?: StoryParams): Promise<ServiceResult<Story[]>> {
  try {
    const res = await api.get(`/admin/stories`, {
      params: params,
      paramsSerializer: (params) => qs.stringify(params, { arrayFormat: "comma" }),
    });
    return res.data;
  } catch (error) {
    console.log(error);
    return { success: false, message: error?.toString() };
  }
}

export async function updateStory(story: Story, coverArtFile?: File): Promise<ServiceResult<Story[]>> {
  try {
    let coverArtUrl;
    let publicId;
    if (coverArtFile) {
      const sigRes = await api.get(`/cloudinary/signature/${story.id}/cover-art`);
      const { timestamp, signature, apiKey, cloudName, folder, publicId } = sigRes.data;

      const formData = new FormData();

      formData.append("file", coverArtFile);
      formData.append("api_key", apiKey);
      formData.append("timestamp", timestamp);
      formData.append("signature", signature);
      formData.append("folder", folder);
      formData.append("public_id", publicId);

      const cloudinaryAxios = axios.create({ baseURL: `https://api.cloudinary.com/v1_1/${cloudName}` });
      const coverArtUpload = await cloudinaryAxios.post(`/image/upload`, formData);

      coverArtUrl = coverArtUpload.data.secure_url;
    }

    const res = await api.put(`/admin/stories/${story.id}`, {
      title: story.title,
      nation: story.nation,
      type: story.type,
      status: story.status,
      genre: story.genres,
      summary: story.summary,
      ...(coverArtUrl && { coverArtUrl: coverArtUrl, publicId: publicId }),
    });
    return res.data;
  } catch (error) {
    console.log(error);
    return { success: false, message: error?.toString() };
  }
}

export async function activeStory({ storyId, isActived }: { storyId: string; isActived: boolean }): Promise<ServiceResult<Story>> {
  try {
    const res = await api.patch(`/admin/stories/${storyId}/active`, { isActived: isActived });
    return res.data;
  } catch (error) {
    console.log(error);
    return { success: false, message: error?.toString() };
  }
}

export async function deleteStory(storyId: string): Promise<ServiceResult<null>> {
  try {
    const res = await api.delete(`/admin/stories/${storyId}`);
    return res.data;
  } catch (error) {
    console.log(error);
    return { success: false, message: error?.toString() };
  }
}

const adminService = {
  getOverview,
  getStatsView,
  getStatsNewUsers,
  getUsers,
  banUser,
  deleteUser,
  updateUser,
  getStory,
  getStories,
  updateStory,
  activeStory,
  deleteStory,
};

export default adminService;
