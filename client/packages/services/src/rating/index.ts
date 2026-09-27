import api from "@/lib/axios";
import qs from "qs";
import { Pagination } from "@/types/pagination";
import { RatingParams } from "@/types/params";
import Rating from "@/types/ratings";
import { handleAxiosError } from "@/utils/error";

type ServiceResult<T> = { success: boolean; data?: T; message?: string; pagination?: Pagination };

export async function getRatings(storyId: string, params: RatingParams): Promise<ServiceResult<Rating[]>> {
  try {
    const res = await api.get(`/ratings/story/${storyId ?? ""}`, {
      params: params,
      paramsSerializer: (params) => qs.stringify(params, { arrayFormat: "comma" }),
    });
    return res.data;
  } catch (error: unknown) {
    return handleAxiosError(error);
  }
}

export async function addNewRating(storyId: string, star: number, title: string, content: string): Promise<ServiceResult<Rating>> {
  try {
    const res = await api.post(`/ratings/story/${storyId ?? ""}`, {
      star: star,
      title: title,
      content: content,
    });
    return res.data;
  } catch (error: unknown) {
    return handleAxiosError(error);
  }
}

const ratingService = { getRatings, addNewRating };

export default ratingService;
