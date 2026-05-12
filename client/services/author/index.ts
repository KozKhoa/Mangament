import api from "@/lib/axios";
import Author from "@/types/author";
import { handleAxiosError } from "@/utils/error";

type Pagination = { page: number; pageSize: number; totalItems: number; totalPages: number };
type ServiceResult<T> = { success: boolean; data?: T; message?: string; pagination?: Pagination };

export async function getAuthors(number: number = 2147483647): Promise<ServiceResult<Author[]>> {
  try {
    const res = await api.get("/authors", { params: { page: 1, limit: number } });
    return res.data;
  } catch (error: unknown) {
    return handleAxiosError(error);
  }
}

const authorService = { getAuthors };

export default authorService;
