"use client";

import { toast } from "sonner";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useCallback, useEffect, useState } from "react";

import SearchBar from "@/components/search/search";
import PieChart from "@/components/chart/pie-chart";
import Loading from "@/components/loadings/loading";

import SwitchPageBig from "@/components/switch-page/big";

import User from "@/types/user";
import { Pagination } from "@/types/pagination";

import adminService from "@/services/admin";
import useAdmin from "@/contexts/AdminContext";
import { capitalizeWords } from "@/utils/string";

import XIcon from "@/public/x-icon.svg";
import AddIcon from "@/public/plus.svg";
import SortUsers from "@/components/sorts/sort-users";
import SortStories from "@/components/sorts/sort-stories";
import Story from "@/types/story";
import storyService from "@/services/story";
import StoriesTable from "@/components/table/stories-table";
import SwitchPageSmall from "@/components/switch-page/small";
import FilterGenres from "@/components/filters/fiilter-genres";
import FilterAuthors from "@/components/filters/filter-authors";
import FilterViews from "@/components/filters/filter-views";
import FilterStoryStatus from "@/components/filters/filter-story-status";
import FilterRatings from "@/components/filters/filter-ratings";
import FilterStoryType from "@/components/filters/filter-story-type";
import { modal } from "@/components/modal/modal.store";
import FilterNation from "@/components/filters/filter-nations";
import Button from "@/components/buttons/button";
import Link from "next/link";

const STORIES_PIE_CHART_COLORS = [
  "#6A4E42", // warm brown
  "#8B6A5E",
  "#A07F73",

  "#7A3E2E", // warm terracotta
  "#9A5A44",
  "#B5745A",
  "#C48A73",
  "#D4A28E",

  "#8F6B2E", // warm olive
  "#A8843E",
  "#B99A55",
  "#CDB57A",
  "#E2D0A6",

  "#6E5A3D", // warm khaki / sand
  "#827054",
  "#9B8A6E",
  "#B1A48D",

  "#8F877F", // warm gray
  "#A39C95",
  "#BDB6AF",
  "#D6D1CC",
  "#E1DDD8",
];

const LIMIT = 10;

export default function StoriesManagementPage() {
  const admin = useAdmin();
  const overview = admin.overview;

  const searchParams = useSearchParams();
  const router = useRouter();

  const [stories, setStoires] = useState<Story[]>([]);
  const [storiesPagination, setStoriesPagination] = useState<Pagination>();
  const [loadingStoies, setLoadingStories] = useState(true);

  const page = Number(searchParams.get("page") ?? 1);
  const sort = searchParams.get("sort") ?? "updated_at:desc";
  const searchStories = searchParams.get("search") ?? "";
  const genres = searchParams.get("genre")?.split(",");
  const author = searchParams.get("author")?.split(",");
  const star = searchParams.get("star")?.split(",");
  const view = searchParams.get("view")?.split(",");
  const status = searchParams.get("status")?.split(",");
  const storyType = searchParams.get("type")?.split(",");
  const nation = searchParams.get("nation")?.split(",");

  const handleNavigate = useCallback(
    (key: string, value: string) => {
      const params = new URLSearchParams(searchParams);

      params.set("page", "1");

      if (!value) {
        params.delete(key);
      } else {
        params.set(key, value);
      }

      router.push(`?${params.toString()}`);
    },
    [searchParams],
  );

  const handleResetSearchParams = useCallback(() => {
    router.push(`?page=1&sort=updated_at:desc`);
  }, []);

  useEffect(() => {
    async function fetchStories() {
      setLoadingStories(true);
      const res = await adminService.getStories({
        keyword: searchStories,
        type: storyType,
        page: page,
        limit: LIMIT,
        sort: sort,
        genre: genres,
        author: author,
        star: star,
        view: view,
        status: status,
        nation: nation,
      });
      setLoadingStories(false);

      if (!res.success) return toast.warning(res.message);

      setStoires(res.data ?? []);
      setStoriesPagination(res.pagination);
    }

    fetchStories();
  }, [searchParams]);

  return (
    <div>
      <div className="w-full">
        <Link href={"/admin/stories-management/add"}>
          <Button className="ml-auto">
            <p className="text-lg">Thêm mới</p>
            <AddIcon className="w-5 h-5"></AddIcon>
          </Button>
        </Link>
      </div>
      <div>
        <h2 className="w-full text-center">Stories</h2>
        <PieChart
          className="w-[400px] shrink-0 flex-wrap"
          values={Object.keys(overview?.totalStoriesBaseOnStatus ?? []).map((value) => ({
            key: capitalizeWords(value),
            value: Number(overview?.totalStoriesBaseOnStatus[value] ?? 0),
          }))}
          colorsSet={STORIES_PIE_CHART_COLORS}
          strokeWidth={15}
        ></PieChart>

        <div className="flex flex-col gap-4 justify-center items-center ">
          <h2 className="w-full px-2">Users</h2>

          <div className="flex flex-row flex-wrap gap-2 w-full justify-between">
            <div className="flex flex-row flex-wrap gap-2 justify-start items-center h-full">
              <div className="flex flex-col gap-2">
                {/* Filter story */}
                <div className="flex flex-row flex-wrap gap-2">
                  <FilterStoryType value={storyType ?? []} onChange={(type) => handleNavigate("type", type?.join(","))}></FilterStoryType>
                  <FilterRatings value={star ?? []} onChange={(stars) => handleNavigate("star", stars?.join(","))}></FilterRatings>
                  <FilterGenres value={genres ?? []} onChange={(genres) => handleNavigate("genre", genres.join(","))}></FilterGenres>
                  <FilterAuthors value={author ?? []} onChange={(authors) => handleNavigate("author", authors.join(","))}></FilterAuthors>

                  <FilterViews value={view ?? []} onChange={(view) => handleNavigate("view", view.join(","))}></FilterViews>

                  <FilterStoryStatus value={status ?? []} onChange={(status) => handleNavigate("status", status.join(","))}></FilterStoryStatus>

                  <FilterNation value={nation ?? []} onChange={(nations) => handleNavigate("nation", nations.join(","))}></FilterNation>
                </div>

                {/* Sort story and reset params */}
                <div className="flex flex-row flex-wrap gap-2">
                  <SortStories value={sort} onSort={(sort) => handleNavigate("sort", sort)}></SortStories>
                  {searchParams.size > 2 && (
                    <div
                      onClick={handleResetSearchParams}
                      className="h-full my-auto w-fit flex justify-center items-center font-semibold gap-1 text-red-500 cursor-pointer"
                    >
                      <XIcon className="w-5 h-5 text-red-500"></XIcon> Xóa bộ lọc
                    </div>
                  )}
                </div>
              </div>
            </div>
            <div className="flex flex-row flex-wrap gap-2 my-auto">
              <SwitchPageSmall
                maxPage={storiesPagination?.totalPages ?? 0}
                page={page}
                onChange={(page) => handleNavigate("page", page.toString())}
              ></SwitchPageSmall>
              {/* Search */}
              <SearchBar
                className="border-foreground/30 w-[300px] "
                placeHolder="Tìm theo title"
                onSearch={(text) => {
                  handleNavigate("search", text);
                }}
              ></SearchBar>
            </div>
          </div>
          {loadingStoies ? (
            <Loading className="h-64"></Loading>
          ) : (
            <>
              <StoriesTable className="w-full shadow-md" data={stories} pagination={storiesPagination}></StoriesTable>
              <SwitchPageBig
                maxPage={storiesPagination?.totalPages ?? 0}
                page={page}
                onChange={(page) => handleNavigate("page", page.toString())}
              ></SwitchPageBig>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
