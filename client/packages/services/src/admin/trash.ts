import api from "@/lib/axios";
import { handleAxiosError } from "@/utils/error";
import Story from "@/types/story";
import StoryNode from "@/types/story-node";
import Image from "@/types/image";
import { PaginationParams, ServiceResult, StoryTrashNodeParams } from "./types";

// ==========================================
// 1. TRASH IMAGES
// ==========================================

export async function getTrashImages({ page, limit }: PaginationParams = {}): Promise<ServiceResult<Image[]>> {
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

// ==========================================
// 2. TRASH STORIES
// ==========================================

export async function getAllTrashStories({ page, limit }: PaginationParams = {}): Promise<ServiceResult<Story[]>> {
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

// PATCH /admin/stories/trash/restore
export async function restoreManyStories(ids: string[]): Promise<ServiceResult<Story[]>> {
  try {
    const res = await api.patch(`/admin/stories/trash/restore`, { ids: ids });
    return res.data;
  } catch (error: unknown) {
    return handleAxiosError(error);
  }
}

// ==========================================
// 3. TRASH STORY NODES
// ==========================================

export async function getAllTrashStoryNodes({
  storyId,
  parentId,
  page = 1,
  limit = 10,
}: StoryTrashNodeParams = {}): Promise<ServiceResult<StoryNode[]>> {
  try {
    const res = await api.get(`/admin/story-nodes/trash`, {
      params: { storyId, parentId, page, limit },
    });
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

// PATCH /admin/story-nodes/trash/:id/restore
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
