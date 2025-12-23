"use client";

import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { use, useEffect, useRef, useState } from "react";

import useAuth from "@/contexts/AuthContext";

import RequireLogin from "@/components/cards/require-login";

import { FavoureiteParams, HistoryParams } from "@/types/params";
import History from "@/types/history";
import favouriteService from "@/services/favourite";
import StoryCard from "@/components/cards/stories/story-card";
import Favourite from "@/types/favourite";
import DEFAULT from "@/constants/default";
import CardGrid from "@/components/grids/card-grid";

export default function FavouritePage() {
  const auth = useAuth();
  const user = auth?.user;
  const router = useRouter();
  const page = useRef(1);

  const [params, setParams] = useState<FavoureiteParams>(DEFAULT.params);
  const [favourites, setFavourites] = useState<Favourite[]>([]);
  const [loading, setLoading] = useState<boolean>(false);

  async function fetchFavourites() {
    setLoading(true);
    const res = await favouriteService.get({ ...params, ...{ page: 1 } });

    if (!res) return toast.warning("Can not connect with server");
    if (!res.success) return toast.warning(res.message);

    setFavourites(res.data);

    setLoading(false);
  }

  async function fetchMoreFavourites(page: number) {
    setLoading(true);
    const res = await favouriteService.get({ ...params, ...{ page: page } });

    if (!res) return toast.warning("Can not connect with server");
    if (!res.success) return toast.warning(res.message);

    setFavourites((prevFav) => [...prevFav, ...res.data]);

    setLoading(false);
  }

  useEffect(() => {
    page.current = 1;
    fetchFavourites();
  }, [params]);

  return (
    <div>
      {user ? (
        <CardGrid
          label="Truyện Yêu Thích"
          isLoading={loading}
          onScrollToEnd={() => {
            fetchMoreFavourites(++page.current);
          }}
          onChangeParams={(newParams) => {
            setParams(newParams as HistoryParams);
          }}
        >
          {favourites && favourites.map((favourite, i) => <StoryCard key={favourite.id} data={favourite.story}></StoryCard>)}
        </CardGrid>
      ) : (
        <RequireLogin></RequireLogin>
      )}
    </div>
  );
}
