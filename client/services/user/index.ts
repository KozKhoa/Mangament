import api from "@/lib/axios";
import User from "@/types/user";
import axios from "axios";
import { Pagination } from "@/types/pagination";

type ServiceResult<T> = { success: boolean; data?: T; message?: string; pagination?: Pagination };

export async function updateUser(user: User): Promise<ServiceResult<User>> {
  try {
    let avatar;

    if (user.avatar?.file) {
      const formData = new FormData();

      formData.append("image", user.avatar.file);

      const uploadAvatar = await api.post("/uploads/user/me/avatar", formData);

      avatar = { url: uploadAvatar.data?.data?.url, key: uploadAvatar.data?.data?.key, id: uploadAvatar.data?.data?.id };
    }

    const res = await api.put("/users/me", {
      name: user.name,
      gender: user.gender,
      birthday: user.birthday,
      ...(avatar && { avatar: avatar }),
    });

    console.log(res.data);

    return res.data;
  } catch (error: any) {
    console.error(error);
    return { success: false, message: error?.response?.data?.message || error?.message || "Unknown error" };
  }
}

const userService = { updateUser };

export default userService;
