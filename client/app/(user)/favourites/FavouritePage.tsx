"use client";

import { toast } from "sonner";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";

import favouriteService from "@/services/favourite";
import StoryCard from "@/components/cards/stories/story-card";
import Favourite from "@/types/favourite";

import { Pagination } from "@/types/pagination";
import withAuth from "@/hoc/withAuth";
import Loading from "@/components/loadings/loading";
import NoFilterResult from "@/components/cards/no-filter";
import SwitchPageSmall from "@/components/switch-page/small";

const LIMIT = 30;

export function FavouritePage() {
  const router = useRouter();

  const searchParams = useSearchParams();

  const page = Number(searchParams.get("page") ?? 1);

  const [favourites, setFavourites] = useState<Favourite[]>([]);
  const [pagination, setPagination] = useState<Pagination>();
  const [loading, setLoading] = useState<boolean>(true);

  async function fetchFavourites() {
    setLoading(true);
    const res = await favouriteService.getFavouriteStories({ page: page, limit: LIMIT });

    if (!res.success) return toast.warning(res.message);

    setFavourites(res.data ?? []);
    setPagination(res.pagination);

    setLoading(false);
  }

  useEffect(() => {
    if (!page) return;
    fetchFavourites();
  }, [page]);

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
                  <NoFilterResult />
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
