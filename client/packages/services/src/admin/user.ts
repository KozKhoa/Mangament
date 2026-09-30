import api from "@/lib/axios";
import qs from "qs";
import { handleAxiosError } from "@/utils/error";
import User from "@/types/user";
import { BanUserParams, GetUsersParams, ServiceResult, UpdateUserParams } from "./types";

export async function getUsers({
  search,
  page = 1,
  limit = 10,
  joinDate,
  genders,
  roles,
  isBanned,
  sort,
}: GetUsersParams): Promise<ServiceResult<User[]>> {
  try {
    const res = await api.get(`/admin/users`, {
      params: {
        page: page,
        limit: limit,
        search: search,
        fromDate: joinDate?.from,
        toDate: joinDate?.to,
        gender: genders,
        role: roles,
        isBanned: isBanned,
        sort: sort,
      },
      paramsSerializer: (params) => qs.stringify(params, { arrayFormat: "comma" }),
    });
    return res.data;
  } catch (error: unknown) {
    return handleAxiosError(error);
  }
}

export async function updateUser({ userId, name, role }: UpdateUserParams): Promise<ServiceResult<User>> {
  try {
    const res = await api.put(`/admin/users/${userId}`, { name, role });
    return res.data;
  } catch (error: unknown) {
    return handleAxiosError(error);
  }
}

export async function banUser({ userId, isBanned }: BanUserParams): Promise<ServiceResult<null>> {
  try {
    const res = await api.patch(`/admin/users/${userId}/ban`, {
      isBanned: isBanned,
    });
    return res.data;
  } catch (error: unknown) {
    return handleAxiosError(error);
  }
}

export async function deleteUser(userId: string): Promise<ServiceResult<null>> {
  try {
    const res = await api.delete(`/admin/users/${userId}`);
    return res.data;
  } catch (error: unknown) {
    return handleAxiosError(error);
  }
}
