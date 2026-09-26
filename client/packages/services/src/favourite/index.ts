import api from "@/lib/axios";
import { handleAxiosError } from "@/utils/error";
import Favourite from "@/types/favourite";
import { FavoureiteParams } from "@/types/params";
import qs from "qs";

type Pagination = { page: number; pageSize: number; totalItems: number; totalPages: number };
type ServiceResult<T> = { success: boolean; data?: T; message?: string; pagination?: Pagination };

export async function getFavouriteStories(params: FavoureiteParams): Promise<ServiceResult<Favourite[]>> {
  try {
    const res = await api.get("/favourites/user/me", {
      params: params,
      paramsSerializer: (params) => qs.stringify(params, { arrayFormat: "comma" }),
    });
    return res.data;
  } catch (error: unknown) {
    return handleAxiosError(error);
  }
}

export async function addNewFavouriteStory(storyId: string): Promise<ServiceResult<Favourite>> {
  try {
    const res = await api.post(`/favourites/story/${storyId}`, {
      storyId: storyId,
    });
    return res.data;
  } catch (error: unknown) {
    return handleAxiosError(error);
  }
}

export async function removeFavouriteStory(favouriteId: string): Promise<ServiceResult<Favourite>> {
  try {
    const res = await api.delete(`/favourites/${favouriteId}`);
    return res.data;
  } catch (error: unknown) {
    return handleAxiosError(error);
  }
}

const favouriteService = { getFavouriteStories, addNewFavouriteStory, removeFavouriteStory };

export default favouriteService;
