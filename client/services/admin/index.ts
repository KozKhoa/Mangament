import api from "@/lib/axios";
import qs from "qs";
import axios from "axios";
import { Pagination } from "@/types/pagination";
import User from "@/types/user";
import { DashboardOverview, DashboardStatsNewUsers, DashboardStatsView } from "@/types/dashboard";
import Story from "@/types/story";
import { StoryParams } from "@/types/params";
import StoryNode, { StoryNodeContent } from "@/types/story-node";

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

export async function getStory(stroryId: string, params?: StoryParams): Promise<ServiceResult<Story>> {
  try {
    const res = await api.get(`/admin/stories/${stroryId}`, {
      params: params,
      paramsSerializer: (params) => qs.stringify(params, { arrayFormat: "comma" }),
    });
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

export async function addNewStory(story: Story, coverArtFile?: File): Promise<ServiceResult<Story>> {
  try {
    let _coverArtUrl;
    let _publicId;
    if (coverArtFile) {
      const sigRes = await api.get(`/cloudinary/signature/storyType/${story.type}/storyTitle/${story.title}/cover-art`);
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

      _coverArtUrl = coverArtUpload.data.secure_url;
      _publicId = publicId;
    }

    const res = await api.post(`/admin/stories`, {
      title: story.title,
      nation: story.nation,
      type: story.type,
      status: story.status,
      genre: story.genres,
      summary: story.summary,
      ...(_coverArtUrl && { coverArtUrl: _coverArtUrl }),
      ...(_publicId && { publicId: _publicId }),
    });
    return res.data;
  } catch (error) {
    console.log(error);
    return { success: false, message: error?.toString() };
  }
}

export async function updateStory(
  story: Story,
  coverArtFile?: File,
  children?: {
    delete: { story_node: { id: any }[]; content: { id: any }[] };
    add: { story_node: StoryNode[]; content: StoryNodeContent[] };
    edit: { story_node: StoryNode[]; content: StoryNodeContent[] };
  },
): Promise<ServiceResult<Story>> {
  try {
    let coverArtUrl;
    let publicId;
    if (coverArtFile) {
      const formData = new FormData();

      formData.append("image", coverArtFile);

      const updateCoverArtRes = await api.post(`/uploads/story/${story.id}/cover-art`, formData);

      coverArtUrl = updateCoverArtRes.data.data.url;
    }

    if (children?.add) {
      const uploadPromise = children.add.content.map((content, i) => {
        if (content.imageFile) {
          const formData = new FormData();
          formData.append("image", content?.imageFile);
          formData.append("orderIndex", content.order_index.toString());

          return api.post(`uploads/story/${story.id}/story-node/${content.story_node_id}/content`, formData);
        } else {
          return { data: { data: [{ key: undefined, url: undefined }] } };
        }
      });

      const uploadImages = await Promise.all(uploadPromise);

      children.add.content = children.add.content.map((content, i) => ({
        ...content,
        image: { url: uploadImages[i]?.data?.data?.url, key: uploadImages[i].data?.data?.key },
        imageFile: undefined,
      }));
    }

    if (children?.edit) {
      const uploadPromise = children.edit.content.map((content, i) => {
        if (content.imageFile) {
          const formData = new FormData();
          formData.append("image", content?.imageFile);
          formData.append("orderIndex", content.order_index.toString());

          return api.post(`uploads/story/${story.id}/story-node/${content.story_node_id}/content`, formData);
        } else {
          return { data: { data: [{ key: undefined, url: undefined }] } };
        }
      });

      const uploadImages = await Promise.all(uploadPromise);

      console.log(uploadImages);

      children.edit.content = children.edit.content.map((content, i) => ({
        ...content,
        image: { ...content.image, url: uploadImages[i]?.data?.data?.url, key: uploadImages[i]?.data?.data?.key },
        imageFile: undefined,
      }));
    }

    console.log(children);

    const res = await api.put(`/admin/stories/${story.id}`, {
      title: story.title,
      nation: story.nation,
      type: story.type,
      status: story.status,
      genre: story.genres,
      summary: story.summary,
      ...(coverArtUrl && { coverArtUrl: coverArtUrl, publicId: publicId }),
      ...(children && { children: children }),
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
  addNewStory,
  updateStory,
  activeStory,
  deleteStory,
};

export default adminService;
