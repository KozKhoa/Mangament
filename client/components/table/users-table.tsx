import { Pagination } from "@/types/pagination";
import User from "@/types/user";
import Switch from "../switchs/switch";
import { convertDateTo_yyyMMdd } from "@/utils/convert";
import { snakeCaseToCapitalizeWord } from "@/utils/string";
import { CSSProperties, useEffect, useState } from "react";

import DeleteIcon from "@/public/delete.svg";
import EditIcon from "@/public/edit/edit.svg";
import adminService from "@/services/admin";
import { toast } from "sonner";
import GenderTag from "../tags/gender-tag";
import RoleTag from "../tags/role-tag";

import LockIcon from "@/public/lock/lock.svg";
import UnlockIcon from "@/public/lock/unlock.svg";
import Loading from "../loadings/loading";
import { modal } from "../modal/modal.store";
import NoContent from "../cards/no-content";
import AdjustUserInfoForm from "../forms/adjust-user-info";
import Image from "next/image";

export interface UserTableProps {
  className?: string;

  data: User[];
  pagination?: Pagination;
}

// This is tag <td/> of <table/> in html
function TD({ className, children, style }: { className?: string; children?: React.ReactNode | React.ReactNode[]; style?: CSSProperties }) {
  return (
    <td style={style} className={`text-start px-5 py-1 ${className}`}>
      {children}
    </td>
  );
}

export default function UserTable({ className, data }: UserTableProps) {
  // Use to prevent duplicate press when banning or deleting user
  const [processedBanningUsers, setPocessedBanningUsers] = useState(new Set<User>());
  const [processDeleteUsers, setProcessingDeleteUsers] = useState(new Set<User>());

  const [users, setUsers] = useState<User[]>(data);

  // Call api for update user info, a modal will appear for you to update. Can only update name and role
  function updateUserInfo(user: User) {
    modal.open("custom", {
      content: (
        <AdjustUserInfoForm
          user={user}
          className="min-w-[350px]"
          onCancel={modal.close}
          onConfirm={(newUser) => {
            setUsers((prev) => {
              const next = [...prev];
              next[next.findIndex((user) => user.id === newUser.id)] = newUser;
              return next;
            });
            toast.message("Cập nhật thông tin thành công");
            modal.close();
          }}
        ></AdjustUserInfoForm>
      ),
    });
  }

  // Call api for ban/unban user
  async function toggleBanUser(user: User, isBanned: boolean) {
    if (user.role === "admin") return toast.message("Không thể ban admin");

    setPocessedBanningUsers((prev) => {
      const next = new Set(prev);
      next.add(user);
      return next;
    });

    const res = await adminService.banUser({ userId: user.id, isBanned });

    setPocessedBanningUsers((prev) => {
      const next = new Set(prev);
      next.delete(user);
      return next;
    });

    if (!res.success) return toast.warning(res.message);

    setUsers((prev) => {
      const next = [...prev];
      const index = next.indexOf(user);
      next[index].is_banned = isBanned;
      return next;
    });

    if (isBanned) return toast.message(`Ban ${user.name} thành công`);
    else return toast.message(`Hủy ban ${user.name} thành công`);
  }

  // call api for delete user, a modal will appear to reconfirm your decision
  async function deleteUser(user: User) {
    if (user.role === "admin") return toast.message("Không thể xóa admin");

    modal.open("confirm", {
      title: `Xác nhận xóa ?`,
      content: (
        <div>
          <p>
            <span className="font-semibold">Name:</span> {user.name}
          </p>
          <p>
            <span className="font-semibold">Email:</span> {user.email}
          </p>
        </div>
      ),
      onConfirm: async () => {
        setProcessingDeleteUsers((prev) => {
          const next = new Set(prev);
          next.add(user);
          return next;
        });
        const res = await adminService.deleteUser(user.id);
        setProcessingDeleteUsers((prev) => {
          const next = new Set(prev);
          next.delete(user);
          return next;
        });
        if (!res.success) return toast.warning(res.message);
        toast.message(`Xóa "${user.name}" thành công`);
        setUsers((prevUsers) => prevUsers.filter((prevUser) => prevUser !== user));
      },
    });
  }

  useEffect(() => {
    setUsers(data);
  }, [data]);

  return (
    <div className={`bg-background-items rounded-lg  overflow-hidden ${className}`}>
      {users.length > 0 ? (
        <table className="w-full">
          <colgroup className=" ">
            <col className="border-r border-foreground/10" />
            <col className="border-r border-l border-foreground/10" />
            <col className="border-r border-l border-foreground/10" />
            <col className="border-r border-l border-foreground/10" />
            <col className="border-r border-l border-foreground/10" />
            <col className="border-r border-l border-foreground/10" />
            <col className="border-r border-l border-foreground/10" />
            <col className="border-r border-l border-foreground/10" />
            <col className="border-l border-foreground/10" />
          </colgroup>
          <thead className="bg-black/10 text-[1.2em] text-foreground/80 ">
            <tr>
              <th>Avatar</th>
              <th>Name</th>
              <th>Email</th>
              <th>Gender</th>
              <th>Join date</th>
              <th>Birthday</th>
              <th>Role</th>
              <th>Banned</th>
              <th>Action</th>
            </tr>
          </thead>
          <tbody>
            {users.map((user, i) => (
              <tr key={user.id} className={`hover:bg-foreground/10 ${i % 2 === 0 ? "" : "bg-foreground/2"}`}>
                {/* Avatar */}
                <TD>
                  <div className="w-8 aspect-square m-auto">
                    <Image
                      src={user?.avatar?.url.includes("https") ? user?.avatar?.url : process.env.NEXT_PUBLIC_API_URL + "uploads/" + user?.avatar?.url}
                      alt="Avatar"
                      width={100}
                      height={100}
                      unoptimized
                    ></Image>
                  </div>
                </TD>
                <TD>{user.name}</TD>
                <TD>{user.email}</TD>
                <TD>
                  <GenderTag gender={user.gender ?? "other"}></GenderTag>
                </TD>
                <TD>{user.join_date && new Date(user.join_date ?? "").toLocaleDateString("vi")}</TD>
                <TD>{user.birthday && new Date(user.birthday).toLocaleDateString("vi")}</TD>
                <TD>
                  <RoleTag role={user.role}></RoleTag>
                </TD>
                <TD>
                  <div className="flex flex-row gap-2 justify-center items-center w-fit m-auto">
                    <Switch // Toggle for banning user
                      loading={processedBanningUsers.has(user)}
                      disable={user.role === "admin"}
                      borderWeight={0}
                      roundHeight={22}
                      width={40}
                      height={18}
                      bgColorOn={"#F06449"}
                      duration={200}
                      defaultValue={user.is_banned}
                      onToggle={(isOn) => toggleBanUser(user, isOn)}
                    ></Switch>
                    <div className="p-0.5">
                      {user.is_banned ? <LockIcon className="w-5 h-5 text-red-600"></LockIcon> : <UnlockIcon className="w-5 h-5 text-blue-500"></UnlockIcon>}
                    </div>
                  </div>
                </TD>
                <TD>
                  <div className="flex flex-row w-full justify-around items-center">
                    {/* Adjust user info */}
                    <button
                      onClick={() => updateUserInfo(user)}
                      disabled={user.role === "admin"} // Cannot ban, delete or adjust admin information
                      className={`w-5.5 h-5.5 ${user.role === "admin" ? "opacity-60" : "cursor-pointer"}`}
                    >
                      <EditIcon className="w-full h-full text-foreground/90"></EditIcon>
                    </button>
                    {/* Delete user */}
                    <div className={`w-6 h-6 ${user.role === "admin" ? "opacity-60" : "cursor-pointer"}`}>
                      {processDeleteUsers.has(user) ? (
                        <Loading className="w-full h-full"></Loading>
                      ) : (
                        <button disabled={user.role === "admin"} onClick={() => deleteUser(user)}>
                          <DeleteIcon className="w-full h-full text-red-600 "></DeleteIcon>
                        </button>
                      )}
                    </div>
                  </div>
                </TD>
              </tr>
            ))}
          </tbody>
        </table>
      ) : (
        <NoContent></NoContent>
      )}
    </div>
  );
}
