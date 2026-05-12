import api from "@/lib/axios";
import qs from "qs";

import { handleAxiosError } from "@/utils/error";
import { Pagination } from "@/types/pagination";
import User from "@/types/user";
import { DashboardOverview, DashboardStatsNewUsers, DashboardStatsView } from "@/types/dashboard";
import Story from "@/types/story";
import { StoryParams } from "@/types/params";
import StoryNode, { StoryNodeContent } from "@/types/story-node";
import Image from "@/types/image";

type ServiceResult<T> = { success: boolean; data?: T; message?: string; pagination?: Pagination };

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
  } catch (error: unknown) {
    return handleAxiosError(error);
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
  } catch (error: unknown) {
    return handleAxiosError(error);
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
  } catch (error: unknown) {
    return handleAxiosError(error);
  }
}

export async function updateUser({ userId, name, role }: { userId: string; name?: string; role?: string }): Promise<ServiceResult<User>> {
  try {
    const res = await api.put(`/admin/users/${userId}`, { name, role });
    return res.data;
  } catch (error: unknown) {
    return handleAxiosError(error);
  }
}

export async function banUser({ userId, isBanned }: { userId: string; isBanned: boolean }): Promise<ServiceResult<null>> {
  try {
    const res = await api.patch(`/admin/users/${userId}/ban`, {
      isBanned: isBanned,
    });
    return res.data;
  } catch (error: unknown) {
    return handleAxiosError(error);
  }
}

export async function deleteUser(userId: string): Promise<ServiceResult<null>> {
  try {
    const res = await api.delete(`/admin/users/${userId}`);
    return res.data;
  } catch (error: unknown) {
    return handleAxiosError(error);
  }
}

export async function getStory(stroryId: string, params?: StoryParams): Promise<ServiceResult<Story>> {
  try {
    const res = await api.get(`/admin/stories/${stroryId}`, {
      params: params,
      paramsSerializer: (params) => qs.stringify(params, { arrayFormat: "comma" }),
    });
    return res.data;
  } catch (error: unknown) {
    return handleAxiosError(error);
  }
}

export async function getStories(params?: StoryParams): Promise<ServiceResult<Story[]>> {
  try {
    const res = await api.get(`/admin/stories`, {
      params: params,
      paramsSerializer: (params) => qs.stringify(params, { arrayFormat: "comma" }),
    });
    return res.data;
  } catch (error: unknown) {
    return handleAxiosError(error);
  }
}

export async function addNewStory(story: Story, coverArtFile?: File): Promise<ServiceResult<Story>> {
  try {
    let coverArt;

    const res = await api.post(`/admin/stories`, {
      title: story.title,
      other_titles: story.other_titles,
      nation: story.nation,
      type: story.type,
      status: story.status,
      genre: story.genres,
      summary: story.summary,
    });

    const newStory = res.data.data;

    if (coverArtFile && res.data?.success && newStory) {
      const formData = new FormData();
      formData.append("image", coverArtFile);
      const uploadImage = await api.post(`uploads/story/${newStory.id ?? story.title}/cover-art`, formData);

      coverArt = { url: uploadImage.data.data?.url, key: uploadImage.data.data?.key, id: uploadImage.data.data?.id };

      await api.patch(`/admin/stories/${newStory.id}/cover-art`, {
        coverArt: coverArt,
      });
    }

    return res.data;
  } catch (error: unknown) {
    return handleAxiosError(error);
  }
}

export async function updateStory(
  story: Story,
  coverArtFile?: File,
  children?: {
    delete: { story_node: { id: string }[]; content: { id: string }[] };
    add: { story_node: StoryNode[]; content: StoryNodeContent[] };
    edit: { story_node: StoryNode[]; content: StoryNodeContent[] };
  },
): Promise<ServiceResult<Story>> {
  try {
    let coverArt;
    if (coverArtFile) {
      const formData = new FormData();

      formData.append("image", coverArtFile);

      const updateCoverArtRes = await api.post(`/uploads/story/${story.id}/cover-art`, formData);

      coverArt = { url: updateCoverArtRes.data.data?.url, key: updateCoverArtRes.data.data?.key, id: updateCoverArtRes.data.data?.id };
    }

    if (children?.add) {
      const uploadPromise = children.add.content.map((content) => {
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
        image: { ...content.image, id: uploadImages[i]?.data?.data?.id, url: uploadImages[i]?.data?.data?.url, key: uploadImages[i].data?.data?.key },
        imageFile: undefined,
      }));
    }

    if (children?.edit) {
      const uploadPromise = children.edit.content.map((content) => {
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

      children.edit.content = children.edit.content.map((content, i) => ({
        ...content,
        image: { ...content.image, id: uploadImages[i]?.data?.data?.id, url: uploadImages[i]?.data?.data?.url, key: uploadImages[i]?.data?.data?.key },
        imageFile: undefined,
      }));
    }

    const res = await api.put(`/admin/stories/${story.id}`, {
      title: story.title,
      other_titles: story.other_titles,
      nation: story.nation,
      type: story.type,
      status: story.status,
      genre: story.genres,
      summary: story.summary,
      ...(coverArt && { coverArt: coverArt }),
      ...(children && { children: children }),
    });
    return res.data;
  } catch (error: unknown) {
    return handleAxiosError(error);
  }
}

export async function activeStory({ storyId, isActived }: { storyId: string; isActived: boolean }): Promise<ServiceResult<Story>> {
  try {
    const res = await api.patch(`/admin/stories/${storyId}/active`, { isActived: isActived });
    return res.data;
  } catch (error: unknown) {
    return handleAxiosError(error);
  }
}

export async function deleteStory(storyId: string): Promise<ServiceResult<null>> {
  try {
    const res = await api.delete(`/admin/stories/${storyId}`);
    return res.data;
  } catch (error: unknown) {
    return handleAxiosError(error);
  }
}

export async function getTrashImages({ page, limit }: { page?: number; limit?: number }): Promise<ServiceResult<Image[]>> {
  try {
    const res = await api.get(`/admin/images/trash`, {
      params: { page, limit },
    });
    return res.data;
  } catch (error: unknown) {
    return handleAxiosError(error);
  }
}

export async function deleteTrashImage(id: string): Promise<ServiceResult<null>> {
  try {
    const res = await api.delete(`/admin/images/trash/${id}`);
    return res.data;
  } catch (error: unknown) {
    return handleAxiosError(error);
  }
}

export async function deleteManyTrashImages(ids: string[]): Promise<ServiceResult<null>> {
  try {
    const res = await api.delete(`/admin/images/trash`, {
      data: { ids: ids },
    });
    return res.data;
  } catch (error: unknown) {
    return handleAxiosError(error);
  }
}

export async function getAllTrashStories({ page, limit }: { page?: number; limit?: number }): Promise<ServiceResult<Story[]>> {
  try {
    const res = await api.get(`/admin/stories/trash`, {
      params: { page, limit },
    });
    return res.data;
  } catch (error: unknown) {
    return handleAxiosError(error);
  }
}

// DELETE /admin/stories/trash/:id
export async function deletePermanentTrashStory(id: string): Promise<ServiceResult<null>> {
  try {
    const res = await api.delete(`/admin/stories/trash/${id}`);
    return res.data;
  } catch (error: unknown) {
    return handleAxiosError(error);
  }
}

// DELETE /admin/stories/trash
export async function deletePermanentManyTrashStories(ids: string[]): Promise<ServiceResult<null>> {
  try {
    const res = await api.delete(`/admin/stories/trash`, {
      data: { ids: ids },
    });
    return res.data;
  } catch (error: unknown) {
    return handleAxiosError(error);
  }
}

// PATCH /admin/stories/trash/:id/restore
export async function restoreStory(id: string): Promise<ServiceResult<Story>> {
  try {
    const res = await api.patch(`/admin/stories/trash/${id}/restore`);
    return res.data;
  } catch (error: unknown) {
    return handleAxiosError(error);
  }
}

// PATCH /admin/stories/trash/:id/restore
export async function restoreManyStories(ids: string[]): Promise<ServiceResult<Story[]>> {
  try {
    const res = await api.patch(`/admin/stories/trash/restore`, { ids: ids });
    return res.data;
  } catch (error: unknown) {
    return handleAxiosError(error);
  }
}

// DELETE /admin/story-nodes/trash/:id
export async function deletePermanentlyTrashStoryNode(id: string): Promise<ServiceResult<null>> {
  try {
    const res = await api.delete(`/admin/story-nodes/trash/${id}`);
    return res.data;
  } catch (error: unknown) {
    return handleAxiosError(error);
  }
}

// DELETE /admin/story-nodes/trash
export async function deletePermanentlyManyTrashStoryNodes(ids: string[]): Promise<ServiceResult<null>> {
  try {
    const res = await api.delete(`/admin/story-nodes/trash`, { data: { ids: ids } });
    return res.data;
  } catch (error: unknown) {
    return handleAxiosError(error);
  }
}

export async function getAllTrashStoryNodes({
  storyId,
  parentId,
  page = 1,
  limit = 10,
}: {
  storyId?: string;
  parentId?: string;
  page?: number;
  limit?: number;
}): Promise<ServiceResult<StoryNode[]>> {
  try {
    const res = await api.get(`/admin/story-nodes/trash`, {
      params: { storyId, parentId, page, limit },
    });
    return res.data;
  } catch (error: unknown) {
    return handleAxiosError(error);
  }
}

export async function restoreStoryNode(id: string): Promise<ServiceResult<StoryNode>> {
  try {
    const res = await api.patch(`/admin/story-nodes/trash/${id}/restore`);
    return res.data;
  } catch (error: unknown) {
    return handleAxiosError(error);
  }
}

export async function restoreTrashStoryNode(id: string): Promise<ServiceResult<null>> {
  try {
    const res = await api.patch(`/admin/story-nodes/trash/${id}/restore`);
    return res.data;
  } catch (error: unknown) {
    return handleAxiosError(error);
  }
}

export async function restoreManyTrashStoryNodes(ids: string[]): Promise<ServiceResult<null>> {
  try {
    const res = await api.patch(`/admin/story-nodes/trash/restore`, { ids: ids });
    return res.data;
  } catch (error: unknown) {
    return handleAxiosError(error);
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

  getTrashImages,
  getAllTrashStories,
  getAllTrashStoryNodes,
  deleteTrashImage,
  deleteManyTrashImages,

  deletePermanentTrashStory,
  deletePermanentManyTrashStories,

  deletePermanentlyTrashStoryNode,
  deletePermanentlyManyTrashStoryNodes,

  restoreStory,
  restoreManyStories,

  restoreTrashStoryNode,
  restoreManyTrashStoryNodes,
};

export default adminService;
