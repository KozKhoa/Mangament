"use client";

import { toast } from "sonner";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useRef, useState } from "react";

import useAuth from "@/contexts/AuthContext";

import RequireLogin from "@/components/cards/require-login";

import { HistoryParams } from "@/types/params";

import History from "@/types/history";

import CardGrid from "@/components/grids/card-grid";
import HistoryCard from "@/components/cards/history-card";
import historyService from "@/services/history";

import { Pagination } from "@/types/pagination";
import withAuth from "@/hoc/withAuth";
import SwitchPageSmall from "@/components/switch-page/small";
import NoFilterResult from "@/components/cards/no-filter";
import Loading from "@/components/loadings/loading";

const LIMIT = 30;

export function HistoriesPage() {
  const router = useRouter();

  const searchParams = useSearchParams();

  const page = Number(searchParams.get("page") ?? 1);

  const [histories, setHistories] = useState<History[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [pagination, setPagination] = useState<Pagination>();

  async function fetchHistories() {
    setLoading(true);
    const res = await historyService.getHistories({ page: page, limit: LIMIT });

    if (!res.success) return toast.warning(res.message);

    setHistories(res.data ?? []);
    setPagination(res.pagination);

    setLoading(false);
  }

  function removeHistory(history: History) {
    setHistories(histories.filter((x) => x !== history));
  }

  useEffect(() => {
    fetchHistories();
  }, [page]);

  return (
    <div className="px-2">
      <div className={`w-full `}>
        {/* Header */}
        <div className=" w-full border-b-2">
          <h2 className="text-[2em] font-bold mx-4">
            Lịch sử đọc <span className="text-[0.6em] font-normal text-center h-full">({pagination?.totalItems})</span>
          </h2>
        </div>

        {/* Main grid with sort */}
        <div className="flex flex-col gap-2 justify-start items-center py-2 w-full">
          {/* Sort and fiter */}
          {/* <FilterSortHistories className="w-full" onChange={setParams} isResetAll={isResetFilterSort}></FilterSortHistories> */}

          <div>
            {loading ? (
              <Loading className="h-64" />
            ) : (
              <>
                {histories && histories.length > 0 ? (
                  <div
                    className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-3 lg:grid-cols-5 xl:grid-cols-7 gap-2
                      border-b-2 border-foreground pb-2 w-full"
                  >
                    {histories.map((history) => (
                      <HistoryCard key={history.id} history={history} onClickRemove={() => removeHistory(history)}></HistoryCard>
                    ))}
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
            onChange={(pageIndex) => router.push(`/histories?page=${pageIndex}`)}
          />
        </div>
      </div>
    </div>
  );
}

export default withAuth(HistoriesPage);
