"use client";

import { toast } from "sonner";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useMemo, useState } from "react";

import XIcon from "@/public/x-icon.svg";

import History from "@/types/history";

import HistoryCard from "@/components/cards/history-card";
import historyService from "@/services/history";

import { Pagination } from "@/types/pagination";
import withAuth from "@/hoc/withAuth";
import SwitchPageSmall from "@/components/switch-page/small";
import NoFilterResult from "@/components/cards/no-filter";
import Loading from "@/components/loadings/loading";
import SortTime from "@/components/sorts/sort-time";
import FilterDate from "@/components/filters/filter-date";
import { loadingBar } from "@/components/loadings/loading-bar/top-loading-bar.store";

const LIMIT = 30;

export function HistoriesPage() {
  const router = useRouter();

  const searchParams = useSearchParams();

  const page = Number(searchParams.get("page") ?? 1);
  const limit = Number(searchParams.get("limit") ?? LIMIT);
  const sort = searchParams.get("sort") ?? "updated_at:desc";
  const fromDate = searchParams.get("fromDate") ?? "";
  const toDate = searchParams.get("toDate") ?? "";

  const [histories, setHistories] = useState<History[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [pagination, setPagination] = useState<Pagination>();

  async function fetchHistories() {
    setLoading(true);
    const res = await historyService.getHistories({
      page: page,
      limit: limit,
      sort: sort,
      ...(fromDate && { fromDate: new Date(fromDate) }),
      ...(toDate && { toDate: new Date(toDate) }),
    });

    if (!res.success) return toast.warning(res.message);

    setHistories(res.data ?? []);
    setPagination(res.pagination);

    setLoading(false);
  }

  function removeHistory(history: History) {
    setHistories(histories.filter((x) => x !== history));
  }

  function handleNavigate(key: string, value: string) {
    loadingBar.open({});

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
    loadingBar.open({});

    router.push(`?page=1&sort=${sort}`);
  }

  useEffect(() => {
    fetchHistories();

    loadingBar.close();
  }, [searchParams]);

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
          <div className="w-full flex flex-row flex-wrap gap-1 justify-between">
            {/* Filter */}
            <div className="flex flex-row flex-wrap gap-2 px-2 my-1">
              <SortTime value={sort} onSort={(value) => handleNavigate("sort", value)} />
              <FilterDate
                label="From"
                defaultValue={fromDate ? new Date(fromDate) : undefined}
                onChange={(date) => handleNavigate("fromDate", date.toISOString())}
              />
              <FilterDate label="To" defaultValue={toDate ? new Date(toDate) : undefined} onChange={(date) => handleNavigate("toDate", date.toISOString())} />
            </div>

            {/* Sort */}
            <div>
              {searchParams.size > 3 && (
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
            onChange={(pageIndex) => router.push(`/histories?page=${pageIndex}`)}
          />
        </div>
      </div>
    </div>
  );
}

export default withAuth(HistoriesPage);
