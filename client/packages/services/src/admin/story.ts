import api from "@/lib/axios";
import qs from "qs";
import { handleAxiosError } from "@/utils/error";
import Story from "@/types/story";
import { StoryParams } from "@/types/params";
import StoryNode, { StoryNodeContent } from "@/types/story-node";
import { ActiveStoryParams, ServiceResult } from "./types";

export async function getStory(storyId: string, params?: StoryParams): Promise<ServiceResult<Story>> {
  try {
    const res = await api.get(`/admin/stories/${storyId}`, {
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

export async function uploadStoryImage(imageFile: File): Promise<
  ServiceResult<{
    id: string;
    path: string;
    url: string;
    provider: string;
    mine_type: string;
    width?: number;
    height?: number;
    size?: number;
    original_name?: string;
  }>
> {
  try {
    const formData = new FormData();
    formData.append("image", imageFile);
    const res = await api.post("/uploads/story/image", formData);
    return res.data;
  } catch (error: unknown) {
    return handleAxiosError(error);
  }
}

export async function addNewStory(story: Story, coverArtFile?: File): Promise<ServiceResult<Story>> {
  try {
    let coverArt;

    if (coverArtFile) {
      const uploadRes = await uploadStoryImage(coverArtFile);
      if (uploadRes.success && uploadRes.data) {
        const uploaded = uploadRes.data;
        coverArt = {
          path: uploaded.path || uploaded.url,
          provider: uploaded.provider || "r2",
          id: uploaded.id,
          width: uploaded.width,
          height: uploaded.height,
          size: uploaded.size,
        };
      }
    }

    const res = await api.post(`/admin/stories`, {
      title: story.title,
      other_titles: story.other_titles,
      nation: story.nation,
      type: story.type,
      status: story.status,
      genre: story.genres,
      summary: story.summary,
      ...(coverArt && { coverArt }),
    });

    return res.data;
  } catch (error: unknown) {
    return handleAxiosError(error);
  }
}

export async function updateStory(story: Story, coverArtFile?: File): Promise<ServiceResult<Story>> {
  try {
    let coverArt;
    if (coverArtFile) {
      const uploadRes = await uploadStoryImage(coverArtFile);
      if (uploadRes.success && uploadRes.data) {
        const uploaded = uploadRes.data;
        coverArt = {
          path: uploaded.path || uploaded.url,
          provider: uploaded.provider || "r2",
          id: uploaded.id,
          width: uploaded.width,
          height: uploaded.height,
          size: uploaded.size,
        };
      }
    }

    const res = await api.put(`/admin/stories/${story.id}`, {
      title: story.title,
      other_titles: story.other_titles,
      nation: story.nation?.name ?? story.nation,
      type: story.type,
      status: story.status,
      genre: story.genres,
      summary: story.summary,
      ...(coverArt && { coverArt }),
    });
    return res.data;
  } catch (error: unknown) {
    return handleAxiosError(error);
  }
}

export async function updateStoryChildren(
  storyId: string,
  children: {
    delete?: { story_node?: { id: string }[]; content?: { id: string }[] };
    add?: { story_node?: StoryNode[]; content?: StoryNodeContent[] };
    edit?: { story_node?: StoryNode[]; content?: StoryNodeContent[] };
    restore?: { story_node?: { id: string }[]; content?: { id: string }[] };
    permanently_delete?: { story_node?: { id: string }[]; content?: { id: string }[] };
  },
): Promise<ServiceResult<null>> {
  try {
    if (children?.add?.content) {
      const uploadPromise = children.add.content.map((content) => {
        if (content.imageFile) {
          const formData = new FormData();
          formData.append("images", content?.imageFile);
          return api.post("/uploads/story/images", formData);
        } else {
          return { data: { data: [{ key: undefined, url: undefined }] } };
        }
      });

      const uploadImages = await Promise.all(uploadPromise);

      children.add.content = children.add.content.map((content, i) => ({
        ...content,
        image: {
          ...content.image,
          id: uploadImages[i]?.data?.data?.[0]?.id,
          path: uploadImages[i]?.data?.data?.[0]?.path || uploadImages[i]?.data?.data?.[0]?.url,
          provider: uploadImages[i]?.data?.data?.[0]?.provider || "r2",
        },
        imageFile: undefined,
      }));
    }

    if (children?.edit?.content) {
      const uploadPromise = children.edit.content.map((content) => {
        if (content.imageFile) {
          const formData = new FormData();
          formData.append("images", content?.imageFile);
          return api.post("/uploads/story/images", formData);
        } else {
          return { data: { data: [{ key: undefined, url: undefined }] } };
        }
      });

      const uploadImages = await Promise.all(uploadPromise);

      children.edit.content = children.edit.content.map((content, i) => ({
        ...content,
        image: {
          ...content.image,
          id: uploadImages[i]?.data?.data?.[0]?.id,
          path: uploadImages[i]?.data?.data?.[0]?.path || uploadImages[i]?.data?.data?.[0]?.url,
          provider: uploadImages[i]?.data?.data?.[0]?.provider || "r2",
        },
        imageFile: undefined,
      }));
    }

    const res = await api.put(`/admin/stories/${storyId}/children`, {
      children,
    });
    return res.data;
  } catch (error: unknown) {
    return handleAxiosError(error);
  }
}

export async function activeStory({ storyId, isActived }: ActiveStoryParams): Promise<ServiceResult<Story>> {
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
