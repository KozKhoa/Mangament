"use client";

import { toast } from "sonner";
import { useRouter, useSearchParams } from "next/navigation";
import { useCallback, useEffect, useState } from "react";

import SearchBar from "@/components/search/search";
import PieChart from "@/components/chart/pie-chart";
import Loading from "@/components/loadings/loading";
import UserTable from "@/components/table/user-table";
import SwitchPageBig from "@/components/switch-page/big";
import FilterBanned from "@/components/filters/filter-banned";
import FilterRoles, { TargetRole } from "@/components/filters/filter-roles";
import FilterGenders, { TargetGender } from "@/components/filters/filter-genders";

import User from "@/types/user";
import { Pagination } from "@/types/pagination";

import adminService from "@/services/admin";
import useAdmin from "@/contexts/AdminContext";
import { capitalizeWords } from "@/utils/string";

import XIcon from "@/public/x-icon.svg";
import SortUsers from "@/components/sorts/sort-users";

const LIMIT = 15;

export default function UserManagement() {
  const searchParams = useSearchParams();
  const router = useRouter();

  const admin = useAdmin();
  const overview = admin.overview;

  // const [searchUsers, setSearchUsers] = useState<string>("");

  const page = Number(searchParams.get("page") ?? 1);
  const sort = searchParams.get("sort") ?? "join_date:desc";
  const isBanned = searchParams.get("isBanned") == "true" ? true : searchParams.get("isBanned") == "false" ? false : undefined;
  const gender = searchParams.get("gender")?.split(",");
  const role = searchParams.get("role")?.split(",");
  const searchUsers = searchParams.get("search") ?? "";

  const [users, setUsers] = useState<User[]>([]);
  const [loadingUsers, setLoadingUsers] = useState(false);
  const [usersPagination, setUsersPagination] = useState<Pagination>();

  const handleResetSearchParams = useCallback(() => {
    router.push(`?page=1&sort=join_date:desc`, { scroll: false });
  }, []);

  const handleNavigate = useCallback(
    (key: string, value: string) => {
      const params = new URLSearchParams(searchParams);

      params.set("page", "1");

      if (!value) {
        params.delete(key);
      } else {
        params.set(key, value);
      }

      router.push(`?${params.toString()}`, { scroll: false });
    },
    [searchParams],
  );

  useEffect(() => {
    async function fetchUsers() {
      setLoadingUsers(true);
      const res = await adminService.getUsers({ page: page, limit: LIMIT, genders: gender, isBanned: isBanned, roles: role, sort: sort, search: searchUsers });
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

            <div className="flex flex-row flex-wrap w-full justify-between">
              {/* Filter */}
              <div className="flex flex-row gap-2 justify-start items-center h-full">
                <SortUsers value={sort} onSort={(value) => handleNavigate("sort", value)}></SortUsers>
                <FilterGenders value={(gender as TargetGender[]) ?? []} onChange={(genders) => handleNavigate("gender", genders?.join(","))}></FilterGenders>
                <FilterRoles value={(role as TargetRole[]) ?? []} onChange={(roles) => handleNavigate("role", roles?.join(","))}></FilterRoles>
                <FilterBanned
                  value={isBanned as null | boolean}
                  onChange={(value) => handleNavigate("isBanned", value === null ? "" : value.toString())}
                ></FilterBanned>

                {searchParams.size > 2 && (
                  <div
                    onClick={handleResetSearchParams}
                    className="h-full my-auto w-fit flex justify-center items-center font-semibold gap-1 text-error cursor-pointer"
                  >
                    <XIcon className="w-5 h-5 text-error"></XIcon> Xóa bộ lọc
                  </div>
                )}
              </div>
              {/* Search */}
              <SearchBar
                className="border-foreground/30 w-[300px]"
                placeHolder="Tìm theo tên hoặc email"
                onSearch={(text) => {
                  handleNavigate("search", text);
                }}
              ></SearchBar>
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
