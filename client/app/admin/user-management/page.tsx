"use client";

import StatsCard from "@/components/cards/admin/stats-card";
import PieChart from "@/components/chart/pie-chart";
import FilterBanned from "@/components/filters/filter-banned";
import FilterGenders, { TargetGender } from "@/components/filters/filter-genders";
import FilterRoles, { TargetRole } from "@/components/filters/filter-roles";
import Loading from "@/components/loadings/loading";
import SwitchPageBig from "@/components/switch-page/big";
import UserTable from "@/components/table/user-table";

import useAdmin from "@/contexts/AdminContext";
import adminService from "@/services/admin";
import { Pagination } from "@/types/pagination";
import User from "@/types/user";
import { capitalizeWords } from "@/utils/string";
import { useRouter, useSearchParams } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";

const LIMIT = 20;

export default function UserManagement() {
  const searchParams = useSearchParams();
  const router = useRouter();

  const admin = useAdmin();
  const overview = admin.overview;

  const page = Number(searchParams.get("page") ?? 1);
  const sort = searchParams.get("sort") ?? "join_date:desc";
  const isBanned = searchParams.get("isBanned") === "true" ? true : searchParams.get("isBanned") == "false" ? false : undefined;
  const gender = searchParams.get("gender")?.split(",");
  const role = searchParams.get("role")?.split(",");

  console.log(isBanned);

  const [users, setUsers] = useState<User[]>([]);
  const [loadingUsers, setLoadingUsers] = useState(false);
  const [usersPagination, setUsersPagination] = useState<Pagination>();

  const handleNavigate = useCallback(
    (key: string, value: string) => {
      const params = new URLSearchParams(searchParams);

      params.set("page", "1");

      console.log(key, value);

      if (!value) {
        params.delete(key);
      } else {
        params.set(key, value);
      }

      router.push(`?${params.toString()}`);
    },
    [searchParams],
  );

  useEffect(() => {
    async function fetchUsers() {
      setLoadingUsers(true);
      const res = await adminService.getUsers({ page: page, limit: LIMIT, genders: gender, isBanned: isBanned, roles: role, sort: sort });
      setLoadingUsers(false);

      if (!res.success) return toast.warning(res.message);

      setUsers(res.data ?? []);
      setUsersPagination(res.pagination);
    }

    fetchUsers();
  }, [searchParams]);

  return (
    <div>
      {admin.loading ? (
        <Loading className="h-[80vh]"></Loading>
      ) : (
        <div className="flex flex-col gap-5">
          <div>
            <h2 className="w-full text-center">User</h2>
            <PieChart
              className="flex-wrap"
              values={Object.keys(overview?.totalUserBaseOnRole ?? []).map((value) => ({
                key: capitalizeWords(value),
                value: Number(overview?.totalUserBaseOnRole[value] ?? 0),
              }))}
              strokeWidth={15}
            ></PieChart>
          </div>

          <div className="flex flex-col gap-4 justify-center items-center ">
            <h2 className="w-full px-2">Users</h2>
            {/* Filter */}
            <div className="flex flex-row gap-2 justify-start items-center w-full ">
              <FilterGenders value={(gender as TargetGender[]) ?? []} onChange={(genders) => handleNavigate("gender", genders?.join(","))}></FilterGenders>
              <FilterRoles value={(role as TargetRole[]) ?? []} onChange={(roles) => handleNavigate("role", roles?.join(","))}></FilterRoles>
              <FilterBanned
                value={isBanned as null | boolean}
                onChange={(value) => handleNavigate("isBanned", value === null ? "" : value.toString())}
              ></FilterBanned>
            </div>
            {loadingUsers ? (
              <Loading className="h-64"></Loading>
            ) : (
              <>
                <UserTable className="w-full shadow-md" data={users} pagination={usersPagination}></UserTable>
                <SwitchPageBig
                  maxPage={usersPagination?.totalPages ?? 0}
                  page={page}
                  onChange={(page) => handleNavigate("page", page.toString())}
                ></SwitchPageBig>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
