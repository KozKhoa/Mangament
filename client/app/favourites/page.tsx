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
  const [newFavourites, setNewFavourites] = useState<Favourite[]>([]);
  const [favourites, setFavourites] = useState<Favourite[]>([]);
  const [loading, setLoading] = useState<boolean>(false);

  async function fetchFavourite() {
    setLoading(true);
    const res = await favouriteService.get({ ...params, ...{ page: page.current } });

    if (!res) return toast.warning("Can not connect with server");
    if (!res.success) return toast.warning(res.message);

    setNewFavourites(res.data);

    setLoading(false);
  }

  useEffect(() => {
    setFavourites((prevFav) => [...prevFav, ...newFavourites]);
  }, [newFavourites]);

  useEffect(() => {
    page.current = 1;
    setFavourites([]);
    fetchFavourite();
    console.log(params);
  }, [params]);

  return (
    <div>
      {user ? (
        <CardGrid
          label="Truyện Yêu Thích"
          isLoading={loading}
          onScrollToEnd={() => {
            page.current++;
            fetchFavourite();
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
