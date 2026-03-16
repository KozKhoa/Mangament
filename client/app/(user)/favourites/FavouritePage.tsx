"use client";

import { toast } from "sonner";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useMemo, useState } from "react";

import favouriteService from "@/services/favourite";
import StoryCard from "@/components/cards/stories/story-card";
import Favourite from "@/types/favourite";

import XIcon from "@/public/x-icon.svg";

import { Pagination } from "@/types/pagination";
import withAuth from "@/hoc/withAuth";
import Loading from "@/components/loadings/loading";
import NoFilterResult from "@/components/cards/no-filter";
import SwitchPageSmall from "@/components/switch-page/small";

import FilterRatings from "@/components/filters/filter-ratings";
import FilterGenres from "@/components/filters/fiilter-genres";
import FilterAuthors from "@/components/filters/filter-authors";
import FilterViews from "@/components/filters/filter-views";
import FilterStoryStatus from "@/components/filters/filter-story-status";
import FilterNation from "@/components/filters/filter-nations";
import SortTime from "@/components/sorts/sort-time";

const LIMIT = 30;

export function FavouritePage() {
  const router = useRouter();

  const searchParams = useSearchParams();

  const page = Number(searchParams.get("page") ?? 1);
  const limit = Number(searchParams.get("limit") ?? LIMIT);
  const sort = searchParams.get("sort") ?? "created_at:desc";
  const genres = useMemo(() => searchParams.get("genres")?.split(",") ?? [], [searchParams]);
  const authors = useMemo(() => searchParams.get("authors")?.split(",") ?? [], [searchParams]);
  const star = useMemo(() => searchParams.get("star")?.split(",") ?? [], [searchParams]);
  const view = useMemo(() => searchParams.get("view")?.split(",") ?? [], [searchParams]);
  const status = useMemo(() => searchParams.get("status")?.split(",") ?? [], [searchParams]);
  const nation = useMemo(() => searchParams.get("nation")?.split(",") ?? [], [searchParams]);

  const [favourites, setFavourites] = useState<Favourite[]>([]);
  const [pagination, setPagination] = useState<Pagination>();
  const [loading, setLoading] = useState<boolean>(true);

  async function fetchFavourites() {
    setLoading(true);
    const res = await favouriteService.getFavouriteStories({
      page: page,
      limit: limit,
      sort: sort,
      genre: genres,
      star: star,
      view: view,
      status: status,
      nation: nation,
      author: authors,
    });

    if (!res.success) return toast.warning(res.message);

    setFavourites(res.data ?? []);
    setPagination(res.pagination);

    setLoading(false);
  }

  function handleNavigate(key: string, value: string) {
    const params = new URLSearchParams(searchParams.toString());

    params.set("page", "1");

    if (!value) {
      params.delete(key);
    } else {
      params.set(key, value);
    }

    router.push(`?${params.toString()}`);
  }

  function handleResetSearchParams() {
    router.push(`?page=1&sort=${sort}`);
  }

  useEffect(() => {
    if (!page) return;
    fetchFavourites();
  }, [searchParams]);

  return (
    <div className="px-2">
      <div className={`w-full `}>
        {/* Header */}
        <div className=" w-full border-b-2">
          <h2 className="text-[2em] font-bold mx-4">
            Truyện Yêu Thích <span className="text-[0.6em] font-normal text-center h-full">({pagination?.totalItems})</span>
          </h2>
        </div>

        {/* Main grid with sort */}
        <div className="flex flex-col gap-2 justify-start items-center py-2 w-full">
          {/* Sort and fiter */}

          <div className="w-full flex flex-col gap-2">
            {/* Filter */}
            <div className="flex flex-row flex-wrap gap-2">
              <FilterRatings value={star} onChange={(stars) => handleNavigate("star", stars?.join(","))} />
              <FilterGenres value={genres} onChange={(genres) => handleNavigate("genres", genres.join(","))} />
              <FilterAuthors value={authors} onChange={(authors) => handleNavigate("authors", authors.join(","))} />
              <FilterViews value={view} onChange={(view) => handleNavigate("view", view.join(","))} />
              <FilterNation value={nation} onChange={(nations) => handleNavigate("nation", nations.join(","))} />
              <FilterStoryStatus value={status} onChange={(status) => handleNavigate("status", status.join(","))} />
            </div>

            <div className="flex flex-row w-full gap-2 justify-between">
              <SortTime value={sort} onSort={(sort) => handleNavigate("sort", sort)} sortKey="created_at" />

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

          <div>
            {loading ? (
              <Loading className="h-64" />
            ) : (
              <>
                {favourites && favourites.length > 0 ? (
                  <div
                    className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-3 lg:grid-cols-5 xl:grid-cols-7 gap-2
                          border-b-2 border-foreground pb-2 w-full"
                  >
                    {favourites && favourites.map((favourite, i) => <StoryCard key={favourite.id} data={favourite.story}></StoryCard>)}
                  </div>
                ) : (
                  <NoFilterResult onResetFilter={handleResetSearchParams} />
                )}
              </>
            )}
          </div>
        </div>

        <div className="w-full m-2.5">
          <SwitchPageSmall
            className="m-auto"
            defaultPage={1}
            maxPage={pagination?.totalPages ?? 0}
            page={page}
            onChange={(pageIndex) => router.push(`/favourites?page=${pageIndex}`)}
          />
        </div>
      </div>
    </div>
  );
}

export default withAuth(FavouritePage);
