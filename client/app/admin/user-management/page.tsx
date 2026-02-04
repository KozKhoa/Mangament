"use client";

import StatsCard from "@/components/cards/admin/stats-card";
import Loading from "@/components/loadings/loading";
import UserTable from "@/components/table/user-table";

import useAdmin from "@/contexts/AdminContext";
import adminService from "@/services/admin";
import { Pagination } from "@/types/pagination";
import User from "@/types/user";
import { useEffect, useLayoutEffect, useState } from "react";
import { toast } from "sonner";

export default function UserManagement() {
  const admin = useAdmin();
  const overview = admin.overview;

  const [users, setUsers] = useState<User[]>([]);
  const [usersPagination, setUsersPagination] = useState<Pagination>();

  const [usersTable, setUsersTable] = useState<any>();

  useEffect(() => {
    async function fetchUsers() {
      const res = await adminService.getUsers({ page: 1, limit: 30 });

      if (!res.success) return toast.warning(res.message);

      setUsers(res.data ?? []);
      setUsersPagination(res.pagination);
    }

    fetchUsers();
  }, []);

  useEffect(() => {
    const newUsers = users.map((user) => {
      let newUser: any;

      newUser = { ...user, ...{ avatar: <img className="w-10 aspect-square" src={process.env.NEXT_PUBLIC_API_URL + "uploads/" + user?.avatar?.url}></img> } };

      return newUser;
    });
    setUsersTable(newUsers);
  }, [users]);

  return (
    <div>
      {admin.loading ? (
        <Loading className="h-[80vh]"></Loading>
      ) : (
        <div className="flex flex-col gap-5">
          <StatsCard
            label="Users"
            value={overview?.totalUsers}
            subLabel={`${overview?.totalUserBaseOnRole["admin"]} admin`}
            icon={<img src="/user.png"></img>}
          ></StatsCard>

          <UserTable data={users} pagination={usersPagination}></UserTable>
        </div>
      )}
    </div>
  );
}
