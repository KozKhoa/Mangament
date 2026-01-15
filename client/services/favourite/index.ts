import api from "@/lib/axios";
import Favourite from "@/types/favourite";
import { FavoureiteParams } from "@/types/params";
import axios from "axios";
import qs from "qs";

type Pagination = { page: number; pageSize: number; totalItems: number; totalPages: number };
type ServiceResult<T> = { success: boolean; data?: T; message?: string; pagination?: Pagination };

export async function getFavouriteStories(params: FavoureiteParams): Promise<ServiceResult<Favourite[]>> {
  try {
    const res = await api.get("/users/me/favourites", { params: params, paramsSerializer: (params) => qs.stringify(params, { arrayFormat: "comma" }) });
    return res.data;
  } catch (error) {
    console.log(error);
    return { success: false, message: error?.toString() };
  }
}

export async function addNewFavouriteStory(storyId: string): Promise<ServiceResult<Favourite>> {
  try {
    const res = await api.post("/users/me/favourites", {
      storyId: storyId,
    });
    return res.data;
  } catch (error) {
    console.log(error);
    return { success: false, message: error?.toString() };
  }
}

export async function removeFavouriteStory(favouriteId: string): Promise<ServiceResult<Favourite>> {
  try {
    const res = await api.delete(`/users/me/favourites/${favouriteId}`);
    return res.data;
  } catch (error) {
    console.log(error);
    return { success: false, message: error?.toString() };
  }
}

const favouriteService = { getFavouriteStories, addNewFavouriteStory, removeFavouriteStory };

export default favouriteService;
