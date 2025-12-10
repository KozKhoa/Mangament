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
import HistoryCard from "@/components/cards/history-card";
import historyService from "@/services/history";

export default function FavouritePage() {
  const auth = useAuth();
  const user = auth?.user;
  const router = useRouter();
  const page = useRef(1);

  const [params, setParams] = useState<HistoryParams>(DEFAULT.params);
  const [newHistories, setNewHistories] = useState<History[]>([]);
  const [histories, setHistories] = useState<History[]>([]);
  const [loading, setLoading] = useState<boolean>(false);

  async function fetchFavourite() {
    setLoading(true);
    const res = await historyService.get({ ...params, ...{ page: page.current } });

    if (!res) return toast.warning("Can not connect with server");
    if (!res.success) return toast.warning(res.message);

    setNewHistories(res.data);

    setLoading(false);
  }

  useEffect(() => {
    setHistories((prevHis) => [...prevHis, ...newHistories]);
  }, [newHistories]);

  useEffect(() => {
    page.current = 1;
    setHistories([]);
    fetchFavourite();
    console.log(params);
  }, [params]);

  return (
    <div>
      {user ? (
        <CardGrid
          label="Lịch sử xem"
          isLoading={loading}
          onScrollToEnd={() => {
            page.current++;
            fetchFavourite();
          }}
          onChangeParams={(newParams) => {
            setParams(newParams as HistoryParams);
          }}
        >
          {histories && histories.map((history, i) => <HistoryCard key={history.id} history={history}></HistoryCard>)}
        </CardGrid>
      ) : (
        <RequireLogin></RequireLogin>
      )}
    </div>
  );
}
