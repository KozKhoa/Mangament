import api from "@/lib/axios";
import qs from "qs";
import { Pagination } from "@/types/pagination";
import { RatingParams } from "@/types/params";
import Rating from "@/types/ratings";

type ServiceResult<T> = { success: boolean; data?: T; message?: string; pagination?: Pagination };

export async function getRatings(storyId: string, params: RatingParams): Promise<ServiceResult<Rating[]>> {
  try {
    const res = await api.get(`/stories/${storyId ?? ""}/ratings`, {
      params: params,
      paramsSerializer: (params) => qs.stringify(params, { arrayFormat: "comma" }),
    });
    return res.data;
  } catch (error) {
    console.error(error);
    return { success: false, message: error?.toString() };
  }
}

export async function addNewRating(storyId: string, star: number, title: string, content: string): Promise<ServiceResult<Rating>> {
  try {
    const res = await api.post(`/stories/${storyId ?? ""}/ratings`, {
      star: star,
      title: title,
      content: content,
    });
    return res.data;
  } catch (error) {
    console.error(error);
    return { success: false, message: error?.toString() };
  }
}

const ratingService = { getRatings, addNewRating };

export default ratingService;
