import api from "@/lib/axios";

import { handleAxiosError } from "@/utils/error";
import Genre from "@/types/genre";

type Pagination = { page: number; pageSize: number; totalItems: number; totalPages: number };
type ServiceResult<T> = { success: boolean; data?: T; message?: string; pagination?: Pagination };

export async function getAllGenres(): Promise<ServiceResult<Genre[]>> {
  try {
    const res = await api.get(`/genres`);
    return res.data;
  } catch (error: unknown) {
    return handleAxiosError(error);
  }
}

const genreService = { getAllGenres };

export default genreService;
