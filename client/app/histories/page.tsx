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

import useInView from "@/hooks/useInView";

import HistoryGrid from "@/components/grids/history-grid";
import { Pagination } from "@/types/pagination";
import withAuth from "@/hoc/withAuth";

export function FavouritePage() {
  const auth = useAuth();
  const user = auth?.user;
  const router = useRouter();
  const page = useRef(1);

  const [inViewRef, isInView] = useInView();

  const [params, setParams] = useState<HistoryParams>(DEFAULT.params);
  const [histories, setHistories] = useState<History[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [pagination, setPagination] = useState<Pagination>();

  async function fetchHistories() {
    setLoading(true);
    const res = await historyService.getHistories({ ...params, ...{ page: 1 } });

    if (!res.success) return toast.warning(res.message);

    setHistories(res.data ?? []);
    setPagination(res.pagination);

    setLoading(false);
  }

  async function fetchMoreHistories(page: number) {
    if (!histories || !histories.length) return;

    setLoading(true);
    const res = await historyService.getHistories({ ...params, ...{ page: page } });

    if (!res.success) return toast.warning(res.message);

    setHistories((prevHis) => [...prevHis, ...(res.data ?? [])]);

    setLoading(false);
  }

  function removeHistory(history: History) {
    setHistories(histories.filter((x) => x !== history));
  }

  useEffect(() => {
    page.current = 1;
    if (!auth?.user) fetchHistories();
  }, [params, auth?.user]);

  return (
    <div>
      {user ? (
        <>
          <HistoryGrid
            label={
              <>
                Lịch sử đọc <span className="text-[0.6em] font-normal text-center h-full">({pagination?.totalItems})</span>
              </>
            }
            isLoading={loading}
            onScrollToEnd={() => fetchMoreHistories(++page.current)}
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

export default withAuth(FavouritePage);
