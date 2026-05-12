import api from "@/lib/axios";
import User from "@/types/user";
import { handleAxiosError } from "@/utils/error";
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
      birthday: user.birthday || undefined,
      ...(avatar && { avatar: avatar }),
    });

    return res.data;
  } catch (error: unknown) {
    return handleAxiosError(error);
  }
}

const userService = { updateUser };

export default userService;
