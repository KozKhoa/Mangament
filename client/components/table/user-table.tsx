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

export interface UserTableProps {
  className?: string;

  data: User[];
  pagination?: Pagination;
}

function TH({ className, children, ...props }: { className?: string; children?: React.ReactNode | React.ReactNode[] }) {
  return (
    <th
      className={`
          ${className}`}
      {...props}
    >
      {children}
    </th>
  );
}

function TD({ className, children, style }: { className?: string; children?: React.ReactNode | React.ReactNode[]; style?: CSSProperties }) {
  return (
    <td style={style} className={`text-start px-5 py-1 ${className}`}>
      {children}
    </td>
  );
}

export default function UserTable({ className, data }: UserTableProps) {
  const [processedBanningUsers, setPocessedBanningUsers] = useState(new Set<User>());

  const [users, setUsers] = useState<User[]>(data);

  async function toggleBanUser(user: User, isBanned: boolean) {
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

    if (isBanned) return toast.message(`Banned ${user.name} thành công`);
    else return toast.message(`Hủy banned ${user.name} thành công`);
  }

  useEffect(() => {
    setUsers(data);
  }, [data]);

  return (
    <div className="bg-background-items rounded-lg  overflow-hidden">
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
            <TH>Avatar</TH>
            <TH>Name</TH>
            <TH>Email</TH>
            <TH>Gender</TH>
            <TH>Join date</TH>
            <TH>Birthday</TH>
            <TH>Role</TH>
            <TH>Banned</TH>
            <TH>Action</TH>
          </tr>
        </thead>
        <tbody>
          {users.map((user, i) => (
            <tr key={user.id} className={`hover:bg-foreground/10 ${i % 2 === 0 ? "" : "bg-foreground/2"}`}>
              {/* Avatar */}
              <TD>
                <img className="w-8 aspect-square m-auto" src={process.env.NEXT_PUBLIC_API_URL + "uploads/" + user?.avatar?.url}></img>
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
                <Switch
                  className="m-auto"
                  loading={processedBanningUsers.has(user)}
                  disable={user.role === "admin"}
                  borderWeight={0}
                  roundHeight={22}
                  width={40}
                  height={18}
                  duration={200}
                  defaultValue={user.is_banned}
                  onToggle={(isOn) => toggleBanUser(user, isOn)}
                ></Switch>
              </TD>
              <TD className="flex flex-row w-full justify-around items-center">
                <EditIcon className="w-5.5 h-5.5 cursor-pointer text-foreground/90"></EditIcon>
                <DeleteIcon className="w-6 h-6 text-red-600 cursor-pointer"></DeleteIcon>
              </TD>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
