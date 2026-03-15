import api from "@/lib/axios";
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
  } catch (error: any) {
    console.log(error);
    return { success: false, message: error?.response?.data?.message || error?.message || "Unknown error" };
  }
}

export async function addNewFavouriteStory(storyId: string): Promise<ServiceResult<Favourite>> {
  try {
    const res = await api.post(`/favourites/story/${storyId}`, {
      storyId: storyId,
    });
    return res.data;
  } catch (error: any) {
    console.log(error);
    return { success: false, message: error?.response?.data?.message || error?.message || "Unknown error" };
  }
}

export async function removeFavouriteStory(favouriteId: string): Promise<ServiceResult<Favourite>> {
  try {
    const res = await api.delete(`/favourites/${favouriteId}`);
    return res.data;
  } catch (error: any) {
    console.log(error);
    return { success: false, message: error?.response?.data?.message || error?.message || "Unknown error" };
  }
}

const favouriteService = { getFavouriteStories, addNewFavouriteStory, removeFavouriteStory };

export default favouriteService;
