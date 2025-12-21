"use client";

import { toast } from "sonner";
import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";

import SwitchPageBig from "../switch-page/big";
import SwitchPageSmall from "../switch-page/small";
import FilterSort from "../list/filter-sort-stories";
import StoryCard from "../cards/stories/story-card";
import StoryInfoCard from "../cards/stories/story-info-card";
import Loading from "../loadings/loading";

import { convertNewestChapter } from "@/utils/convert";

import storyService from "@/services/story";
import { StoryParams } from "@/types/params";
import NewestChapter from "@/types/newest-chapter";
import Story from "@/types/story";

import SortStories from "../sorts/sort-stories";

import FilterAuthors from "../filters/filter-authors";
import FilterGenres from "../filters/fiilter-genres";
import FilterRatings from "../filters/filter-ratings";
import FilterViews from "../filters/filter-views";
import FilterSortStories from "../list/filter-sort-stories";

interface StoryGridProps {
  label: string;
  storyType: string;
  elementsPerPage?: number;
  className?: string;
}

export default function StoryGrid({ label, storyType, elementsPerPage, className }: StoryGridProps) {
  const router = useRouter();

  const topRef = useRef<HTMLDivElement>(null); // This is use to scroll to top when switch page

  const [params, setParams] = useState({});
  const [page, setPage] = useState<number>(1);
  const [maxPage, setMaxPage] = useState<number>(1);
  const [stories, setStories] = useState<Story[]>();
  const [storyIndex, setStoryIndex] = useState<number>(0);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [limit, setLimit] = useState(elementsPerPage ?? 30);
  const [newestChapter, setNewestChapter] = useState<NewestChapter[][]>();
  const [isResetFilterSort, setIsResetFilterSort] = useState<boolean>(false);

  function handleUpdateParams(params: {}) {
    setParams((oldParams) => ({ ...oldParams, ...params }));
  }

  async function fetchStories() {
    const storyParams: StoryParams = {
      type: storyType,
      page: page,
      limit: limit,
      isGettingNewestChapter: true,
      isGettingSummary: true,
      ...params,
    };

    const res = await storyService.get(storyParams);

    if (!res) return toast.warning("Cannot connect with server");
    if (!res.success) return toast.warning(res.message);

    const stories = res.data;

    setNewestChapter(
      stories.map((story: Story) => {
        return convertNewestChapter(story.newest_chapter || []);
      })
    );
    setStories(stories);
    setIsLoading(false);
  }

  async function fetchCountStories() {
    const storyParams: StoryParams = {
      page: page,
      limit: limit,
      ...params,
    };

    const res = await storyService.count({
      ...storyParams,
      ...{ type: storyType },
    });

    if (!res) return toast.warning("Sever Error");
    if (!res.success) return toast.warning(res.message);

    const count = res.data.count;

    setMaxPage(Math.ceil(count / limit) ?? 0);
  }

  useEffect(() => {
    setIsLoading(true);
    fetchStories();
    fetchCountStories();
    setIsResetFilterSort(false);
  }, [page, params]);

  useEffect(() => {
    topRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [page]);

  return (
    <div ref={topRef} className={`w-full flex flex-row justify-center items-start gap-5 ${className}`}>
      <div className="w-full">
        {/* Header use to display story type and page index */}
        <div
          className=" sticky top-12 py-2 px-5 z-10 w-full
              flex flex-row flex-wrap justify-between items-center gap-2
              bg-background border-b-2 "
        >
          {/* Story type */}
          <h2 className="text-[2em] font-bold cursor-pointer" onClick={() => router.push(`/stories/${storyType}`)}>
            {label}
          </h2>
          <div className="flex flex-row flex-wrap justify-start items-center gap-2 text-[1.2em] font-bold">
            {/* Switch page */}
            <SwitchPageSmall maxPage={maxPage} page={page} onChange={(pageNumber) => setPage(pageNumber)}></SwitchPageSmall>
          </div>
        </div>

        {/* Main grid with sort */}
        <div className="flex flex-col gap-2 justify-start items-center py-2 w-full">
          {/* Sort and fiter */}
          <FilterSortStories
            className="w-full"
            onChange={(newParams) => {
              setPage(1);
              handleUpdateParams(newParams);
            }}
            isResetAll={isResetFilterSort}
          ></FilterSortStories>

          {isLoading ? (
            <Loading></Loading>
          ) : stories?.length !== undefined && stories?.length > 0 ? (
            // Grid
            <main
              className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-3 lg:grid-cols-5 xl:grid-cols-6 gap-2
            border-b-2 border-foreground pb-2
          "
            >
              {stories.map((story, i) => (
                <div key={story.id} onMouseEnter={() => setStoryIndex(i)}>
                  <StoryCard data={story}></StoryCard>
                </div>
              ))}
            </main>
          ) : (
            <div className="w-full flex flex-col gap-5 py-20 justify-center items-center ">
              <img className="w-20 h-20" src={"/filter-color.png"}></img>
              <h2>Không có kết quả</h2>
              <p>Vui lòng điều chỉnh bộ lọc</p>
              <button
                className="px-5 py-2 bg-foreground text-background rounded-sm"
                onClick={() => {
                  setParams({});
                  setIsResetFilterSort(true);
                }}
              >
                Xóa bộ lọc
              </button>
            </div>
          )}

          <SwitchPageBig page={page} maxPage={maxPage} onChange={(pageNumber) => setPage(pageNumber)}></SwitchPageBig>
        </div>
      </div>

      {!isLoading && stories?.length !== undefined && stories?.length > 0 && (
        <StoryInfoCard
          className="hidden md:flex sticky top-30 mt-30"
          story={stories?.at(storyIndex)}
          newestChapter={newestChapter?.[storyIndex]}
        ></StoryInfoCard>
      )}
    </div>
  );
}
