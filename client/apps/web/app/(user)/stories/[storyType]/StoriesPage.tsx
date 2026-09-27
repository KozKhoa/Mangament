"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useParams, usePathname, useRouter, useSearchParams } from "next/navigation";

import { snakeCaseToCapitalizeWord } from "@/utils/string";

import Story from "@/types/story";
import { Pagination } from "@/types/pagination";

import storyService from "@/services/story";

import XIcon from "@/public/x-icon.svg";

import { toast } from "sonner";
import Loading from "@/components/loadings/loading";
import StoryCard from "@/components/cards/stories/story-card";
import SwitchPageBig from "@/components/switch-page/big";
import StoryInfoCard from "@/components/cards/stories/story-info-card";

import DEFAULT from "@/constants/default";

import SwitchPageSmall from "@/components/switch-page/small";
import SortStories from "@/components/sorts/sort-stories";
import FilterRatings from "@/components/filters/filter-ratings";
import FilterGenres from "@/components/filters/fiilter-genres";
import FilterAuthors from "@/components/filters/filter-authors";
import FilterViews from "@/components/filters/filter-views";
import FilterStoryStatus from "@/components/filters/filter-story-status";
import FilterNation from "@/components/filters/filter-nations";
import { loadingBar } from "@/components/loadings/loading-bar/top-loading-bar.store";
import { routes } from "@/lib/routes";
import Navbar from "@/components/layouts/navbar";

const LIMIT = 30;

export default function StoriesPage() {
  const router = useRouter();
  const params = useParams();
  const searchParams = useSearchParams();
  const pathname = usePathname();

  const storyType = params?.storyType?.toString() ?? "";

  const page = useMemo(() => Number(searchParams.get("page") ?? 1), [searchParams]);
  const sort = useMemo(() => searchParams.get("sort")?.toString() ?? "", [searchParams]);
  const genres = useMemo(() => searchParams.get("genres")?.split(",") ?? [], [searchParams]);
  const authors = useMemo(() => searchParams.get("authors")?.split(",") ?? [], [searchParams]);
  const star = useMemo(() => searchParams.get("star")?.split(",") ?? [], [searchParams]);
  const view = useMemo(() => searchParams.get("view")?.split(",") ?? [], [searchParams]);
  const status = useMemo(() => searchParams.get("status")?.split(",") ?? [], [searchParams]);
  const nation = useMemo(() => searchParams.get("nation")?.split(",") ?? [], [searchParams]);

  const [loading, setLoading] = useState(true);
  const [hoverStoryIndex, setHoverStoryIndex] = useState<number>(0);
  const [isHoveringOnStoryInfoCard, setIsHoveringOnStoryInfoCard] = useState<boolean>(false);
  const [startToHoverIndex, setStartToHoverIndex] = useState<number>(0);
  const [stories, setStories] = useState<Story[] | null>(null);
  const [pagination, setPagination] = useState<Pagination>();

  function handleNavigate(key: string, value: string) {
    loadingBar.open({});

    const params = new URLSearchParams(searchParams.toString());

    params.set("page", "1");

    if (!value) {
      params.delete(key);
    } else {
      params.set(key, value);
    }

    router.push(`${pathname}?${params.toString()}`);
  }

  const handleResetSearchParams = useCallback(() => {
    loadingBar.open({});

    router.push(`?page=1&sort=${sort}`);
  }, [sort]);

  useEffect(() => {
    async function fetchStories() {
      setLoading(true);

      const res = await storyService.getStories({
        ...DEFAULT.params,
        page: page,
        limit: LIMIT,
        type: [storyType],
        nation: nation,
        isGettingNewestChapter: true,
        isGettingSummary: true,

        ...(sort && { sort: sort }),
        ...(authors && authors.length > 0 && { author: authors }),
        ...(genres && genres.length > 0 && { genre: genres }),
        ...(star && star.length > 0 && { star: star }),
        ...(view && view.length > 0 && { view: view }),
        ...(status && status.length > 0 && { status: status }),
      });

      setLoading(false);

      if (!res.success) return toast.warning(res.message);

      setStories(res.data ?? []);
      setPagination(res.pagination);
    }

    fetchStories();

    loadingBar.close();
  }, [searchParams]);

  useEffect(() => {
    const timeout = setTimeout(() => {
      setHoverStoryIndex(startToHoverIndex);
    }, 200);

    if (isHoveringOnStoryInfoCard) {
      clearTimeout(timeout);
    }

    return () => clearTimeout(timeout);
  }, [startToHoverIndex, isHoveringOnStoryInfoCard]);

  return (
    <div className="w-full h-full flex flex-col px-2.5 py-3">
      <Navbar items={["Stories"]} />

      <div className={`w-full flex flex-row justify-center items-start gap-5 `}>
        <div className="w-full">
          {/* Header use to display story type and page index */}
          <div className=" sticky top-0 py-2 px-5 z-10 w-full flex flex-row flex-wrap justify-between items-center gap-2 bg-background border-b-2 ">
            {/* Story type */}
            <h2 className="text-[2em] font-bold cursor-pointer" onClick={() => router.push(routes.story({ storyType }))}>
              {snakeCaseToCapitalizeWord(storyType)} <span className="text-[0.6em] font-normal text-center h-full">({pagination?.totalItems})</span>
            </h2>
            <div className="flex flex-row flex-wrap justify-start items-center gap-2 text-[1.2em] font-bold">
              {/* Switch page */}
              <SwitchPageSmall
                maxPage={pagination?.totalPages ?? 0}
                page={page}
                onChange={(pageNumber) => handleNavigate("page", pageNumber.toString())}
              ></SwitchPageSmall>
            </div>
          </div>

          {/* Main grid with sort */}
          <div className="flex flex-col gap-2 justify-start items-center py-2 w-full">
            <div className="w-full flex flex-col gap-2 px-1.5">
              <div className={`flex flex-row flex-wrap gap-2 w-full`}>
                <FilterRatings value={star} onChange={(stars) => handleNavigate("star", stars?.join(","))} />

                <FilterGenres value={genres} onChange={(genres) => handleNavigate("genres", genres.join(","))} />

                <FilterAuthors value={authors} onChange={(authors) => handleNavigate("authors", authors.join(","))} />

                <FilterViews value={view} onChange={(view) => handleNavigate("view", view.join(","))} />

                <FilterNation value={nation} onChange={(nations) => handleNavigate("nation", nations.join(","))} />

                <FilterStoryStatus value={status} onChange={(status) => handleNavigate("status", status.join(","))} />
              </div>

              <div className="flex flex-row flex-wrap justify-between gap-2 w-full">
                <SortStories value={sort ?? ""} onSort={(sort) => handleNavigate("sort", sort)} />

                {searchParams.size > 2 && (
                  <div
                    onClick={handleResetSearchParams}
                    className="h-full my-auto w-fit flex justify-center items-center font-semibold gap-1 text-error cursor-pointer"
                  >
                    <XIcon className="w-5 h-5 text-error" /> Xóa bộ lọc
                  </div>
                )}
              </div>
            </div>
            {loading ? (
              <Loading className="w-full h-64"></Loading>
            ) : stories?.length !== undefined && stories?.length > 0 ? (
              // Grid
              <main
                className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-3 lg:grid-cols-5 xl:grid-cols-6 gap-2
                  border-b-2 border-foreground pb-2
                "
              >
                {stories.map((story, i) => (
                  <div key={story.id} onMouseOver={() => setStartToHoverIndex(i)}>
                    <StoryCard className="bg-background-items" data={story}></StoryCard>
                  </div>
                ))}
              </main>
            ) : (
              <div className="w-full flex flex-col gap-5 py-20 justify-center items-center ">
                <img className="w-20 h-20" src={"/filter-color.png"}></img>
                <h2>Không có kết quả</h2>
                <p>Vui lòng điều chỉnh bộ lọc</p>
                <button onClick={handleResetSearchParams} className="px-5 py-2 bg-foreground text-background-items rounded-sm">
                  Xóa bộ lọc
                </button>
              </div>
            )}

            <SwitchPageBig page={page} maxPage={pagination?.totalPages ?? 0} onChange={(page) => handleNavigate("page", page.toString())}></SwitchPageBig>
          </div>
        </div>

        {!loading && stories?.length !== undefined && stories?.length > 0 && (
          <div
            className="hidden md:flex sticky top-16 w-[320px]"
            onMouseOver={() => setIsHoveringOnStoryInfoCard(true)}
            onMouseLeave={() => setIsHoveringOnStoryInfoCard(false)}
          >
            <StoryInfoCard story={stories[hoverStoryIndex ?? 0]} className="bg-background-items overflow-y-scroll max-h-[85vh] custom-scrollbar" />
          </div>
        )}
      </div>
    </div>
  );
}
