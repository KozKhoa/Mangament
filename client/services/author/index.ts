import api from "@/lib/axios";
import axios from "axios";

type Pagination = { page: number; pageSize: number; totalItems: number; totalPages: number };
type ServiceResult<T> = { success: boolean; data?: T; message?: string; pagination?: Pagination };

export async function getAuthors(number?: number | null): Promise<ServiceResult<string[]>> {
  try {
    const res = await api.get("/authors", { params: { page: 1, limit: number ?? 2147483647 } });
    return res.data;
  } catch (error) {
    console.log(error);
    return { success: false, message: error?.toString() };
  }
}

const authorService = { getAuthors };

export default authorService;
