import api from "@/lib/axios";

import { handleAxiosError } from "@/utils/error";
import Genre from "@/types/genre";

type Pagination = { page: number; pageSize: number; totalItems: number; totalPages: number };
type ServiceResult<T> = { success: boolean; data?: T; message?: string; pagination?: Pagination };

class GenreService {
  async getAllGenres(): Promise<ServiceResult<Genre[]>> {
    try {
      const res = await api.get(`/genres`);
      return res.data;
    } catch (error: unknown) {
      return handleAxiosError(error);
    }
  }

  async getTrendingGenres(page: number, limit: number): Promise<ServiceResult<{ genre: Genre; score: number }[]>> {
    try {
      const res = await api.get(`/genres/trending?page=${page || 1}&limit=${limit || 10}`);
      return res.data;
    } catch (error: unknown) {
      return handleAxiosError(error);
    }
  }
}

const genreService = new GenreService();

export default genreService;
