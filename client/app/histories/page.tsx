"use client";

import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";

import useAuth from "@/contexts/AuthContext";

import RequireLogin from "@/components/cards/require-login";

import { HistoryParams } from "@/types/params";
import History from "@/types/history";
import DEFAULT from "@/constants/default";
import CardGrid from "@/components/grids/card-grid";
import HistoryCard from "@/components/cards/history-card";
import historyService from "@/services/history";

import NoFilterResult from "@/components/cards/no-filter";
import FilterSort from "@/components/list/filter-sort";
import Loading from "@/components/loadings/loading";
import useInView from "@/hooks/useInView";

import FilterAuthors from "@/components/filters/filter-authors";
import FilterGenres from "@/components/filters/fiilter-genres";
import FilterRatings from "@/components/filters/filter-ratings";
import FilterViews from "@/components/filters/filter-views";
import FilterStoryType from "@/components/filters/filter-story-type";
import SortTime from "@/components/sorts/sort-time";
import FilterSortHistories from "@/components/list/filter-sort-histories";
import HistoryGrid from "@/components/grids/history-grid";

export default function FavouritePage() {
  const auth = useAuth();
  const user = auth?.user;
  const router = useRouter();
  const page = useRef(1);

  const [inViewRef, isInView] = useInView();

  const [params, setParams] = useState<HistoryParams>(DEFAULT.params);
  const [histories, setHistories] = useState<History[]>([]);
  const [newHistories, setNewHistories] = useState<History[]>([]);
  const [loading, setLoading] = useState<boolean>(false);

  async function fetchFavourite() {
    setLoading(true);
    const res = await historyService.get({ ...params, ...{ page: page.current } });

    if (!res) return toast.warning("Can not connect with server");
    if (!res.success) return toast.warning(res.message);

    setNewHistories(res.data);

    setLoading(false);
  }

  function removeHistory(history: History) {
    setHistories(histories.filter((x) => x !== history));
  }

  useEffect(() => {
    setHistories((prevHis) => [...prevHis, ...newHistories]);
  }, [newHistories]);

  useEffect(() => {
    page.current = 1;
    setHistories([]);
    fetchFavourite();
  }, [params]);

  return (
    <div>
      {user ? (
        <>
          <HistoryGrid
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
            {histories &&
              histories.map((history, i) => <HistoryCard key={history.id} history={history} onClickRemove={() => removeHistory(history)}></HistoryCard>)}
          </HistoryGrid>
        </>
      ) : (
        <RequireLogin></RequireLogin>
      )}
    </div>
  );
}
