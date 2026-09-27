"use client";

import { useEffect, useState, useCallback } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { toast } from "sonner";

import storyService from "@/services/story";
import Story from "@/types/story";
import { StoryParams } from "@/types/params";

import SortStories from "@/components/sorts/sort-stories";
import FilterRatings from "@/components/filters/filter-ratings";
import FilterGenres from "@/components/filters/fiilter-genres";
import FilterAuthors from "@/components/filters/filter-authors";
import FilterViews from "@/components/filters/filter-views";
import FilterStoryStatus from "@/components/filters/filter-story-status";
import FilterNation from "@/components/filters/filter-nations";
import FilterStoryType from "@/components/filters/filter-story-type";
import StoryCard from "@/components/cards/stories/story-card";
import Loading from "@/components/loadings/loading";
import SwitchPageSmall from "@/components/switch-page/small";
import SwitchPageBig from "@/components/switch-page/big";

import XIcon from "@/public/x-icon.svg";
import { Pagination } from "@/types/pagination";

const DEFAULT_LIMIT = 30;

export default function SearchPage() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const page = parseInt(searchParams.get("page") || "1");
  const limit = parseInt(searchParams.get("limit") || DEFAULT_LIMIT.toString());
  const keyword = searchParams.get("keyword") || "";
  const type = searchParams.get("type")?.split(",") || [];
  const genres = searchParams.get("genres")?.split(",") || [];
  const authors = searchParams.get("authors")?.split(",") || [];
  const status = searchParams.get("status")?.split(",") || [];
  const star = searchParams.get("star")?.split(",") || [];
  const view = searchParams.get("view")?.split(",") || [];
  const nation = searchParams.get("nation")?.split(",") || [];
  const sort = searchParams.get("sort") || "updated_at:desc";

  const [stories, setStories] = useState<Story[]>([]);
  const [pagnigation, setPagnigation] = useState<Pagination>();
  const [isLoading, setIsLoading] = useState(false);

  const fetchStories = useCallback(async () => {
    setIsLoading(true);
    const params: StoryParams = {
      keyword,
      type: type.length > 0 ? type : undefined,
      genre: genres.length > 0 ? genres : undefined,
      author: authors.length > 0 ? authors : undefined,
      status: status.length > 0 ? status : undefined,
      star: star.length > 0 ? star : undefined,
      view: view.length > 0 ? view : undefined,
      nation: nation.length > 0 ? nation : undefined,
      sort,
      page,
      limit,
      isGettingNewestChapter: true,
    };

    try {
      const storiesRes = await storyService.getStories(params);

      if (storiesRes.success) {
        setStories(storiesRes.data ?? []);
        setPagnigation(storiesRes.pagination);
      } else {
        toast.warning(storiesRes.message);
      }
    } catch (error) {
      toast.error("Không thể kết nối đến máy chủ");
    } finally {
      setIsLoading(false);
    }
  }, [searchParams, page]);

  const handleResetSearchParams = useCallback(() => {
    router.push(`?keyword=${keyword}&page=1&sort=${sort}`);
  }, [keyword, sort]);

  useEffect(() => {
    fetchStories();
  }, [fetchStories]);

  const handleUpdateParam = (key: string, value: string | string[]) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set("page", "1"); // Reset to page 1 on filter change
    if (Array.isArray(value)) {
      if (value.length > 0) {
        params.set(key, value.join(","));
      } else {
        params.delete(key);
      }
    } else {
      if (value) {
        params.set(key, value);
      } else {
        params.delete(key);
      }
    }
    router.push(`/search?${params.toString()}`);
  };

  const handlePageChange = (newPage: number) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set("page", newPage.toString());
    router.push(`/search?${params.toString()}`);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  return (
    <div className="max-w-[1600px] mx-auto px-4 py-8">
      <div className="flex flex-col lg:flex-row gap-8">
        {/* Left Sidebar - Filters */}
        <aside className="w-full lg:w-72 shrink-0 z-10">
          <div className="sticky top-16 space-y-6 bg-background-items backdrop-blur-md p-6 rounded-md shadow-lg border border-white/10">
            <div className="flex items-center justify-between mb-2">
              <h2 className="text-xl font-bold">Bộ lọc</h2>
              {searchParams.size > 4 && (
                <div
                  onClick={handleResetSearchParams}
                  className="h-full my-auto w-fit flex justify-center items-center font-semibold gap-1 text-error cursor-pointer hover:opacity-80 transition-opacity"
                >
                  <XIcon className="w-5 h-5 text-error" /> Xóa bộ lọc
                </div>
              )}
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-1 gap-3">
              <div className="space-y-2">
                <p className="text-sm font-medium text-muted-foreground ml-1">Sắp xếp</p>
                <SortStories value={sort} onSort={(s) => handleUpdateParam("sort", s)} />
              </div>

              <div className="space-y-2">
                <p className="text-sm font-medium text-muted-foreground ml-1">Loại truyện</p>
                <FilterStoryType value={type} onChange={(v) => handleUpdateParam("type", v)} />
              </div>

              <div className="space-y-2">
                <p className="text-sm font-medium text-muted-foreground ml-1">Thể loại</p>
                <FilterGenres value={genres} onChange={(v) => handleUpdateParam("genres", v)} />
              </div>

              <div className="space-y-2">
                <p className="text-sm font-medium text-muted-foreground ml-1">Tác giả</p>
                <FilterAuthors value={authors} onChange={(v) => handleUpdateParam("authors", v)} />
              </div>

              <div className="space-y-2">
                <p className="text-sm font-medium text-muted-foreground ml-1">Tình trạng</p>
                <FilterStoryStatus value={status} onChange={(v) => handleUpdateParam("status", v)} />
              </div>

              <div className="space-y-2">
                <p className="text-sm font-medium text-muted-foreground ml-1">Đánh giá</p>
                <FilterRatings value={star} onChange={(v) => handleUpdateParam("star", v)} />
              </div>

              <div className="space-y-2">
                <p className="text-sm font-medium text-muted-foreground ml-1">Lượt xem</p>
                <FilterViews value={view} onChange={(v) => handleUpdateParam("view", v)} />
              </div>

              <div className="space-y-2">
                <p className="text-sm font-medium text-muted-foreground ml-1">Quốc gia</p>
                <FilterNation value={nation} onChange={(v) => handleUpdateParam("nation", v)} />
              </div>
            </div>
          </div>
        </aside>

        {/* Right Content - Results */}
        <main className="grow">
          <div className="mb-8 flex flex-col md:flex-row md:items-end justify-between gap-4">
            <div>
              <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight">
                {keyword ? (
                  <span>
                    Kết quả tìm kiếm cho: <span className="text-primary italic">"{keyword}"</span>
                  </span>
                ) : (
                  "Tất cả truyện"
                )}
              </h1>
              <p className="text-muted-foreground mt-2">Tìm thấy {pagnigation?.totalItems || 0} kết quả phù hợp</p>
            </div>

            <div className="flex items-center gap-2">
              <SwitchPageSmall page={page} maxPage={pagnigation?.totalPages || 0} onChange={handlePageChange} />
            </div>
          </div>

          {isLoading ? (
            <div className="flex justify-center items-center h-64">
              <Loading />
            </div>
          ) : stories.length > 0 ? (
            <div className="space-y-10">
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 xl:grid-cols-5 gap-4 md:gap-6">
                {stories.map((story) => {
                  return (
                    <div key={story.id} className="relative group">
                      <StoryCard data={story} />
                    </div>
                  );
                })}
              </div>

              <div className="flex justify-center pt-8 border-t border-white/5">
                <SwitchPageBig page={page} maxPage={pagnigation?.totalPages || 0} onChange={handlePageChange} />
              </div>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-24 text-center space-y-4 bg-background/50 rounded-3xl border border-dashed border-white/20">
              <div className="w-20 h-20 bg-muted rounded-full flex items-center justify-center">
                <svg className="w-10 h-10 text-muted-foreground" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </div>
              <div className="space-y-2">
                <h3 className="text-xl font-semibold">Không tìm thấy kết quả nào cho từ khóa: "{keyword}"</h3>
                <p className="text-muted-foreground">Thử tìm kiếm với từ khóa khác hoặc điều chỉnh bộ lọc.</p>
              </div>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
