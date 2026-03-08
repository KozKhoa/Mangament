"use client";

import { useEffect, useRef, useState } from "react";

import Loading from "../loadings/loading";

import { Params } from "@/types/params";

import FilterAuthors from "../filters/filter-authors";
import FilterGenres from "../filters/fiilter-genres";
import FilterRatings from "../filters/filter-ratings";
import FilterViews from "../filters/filter-views";
import NoFilterResult from "../cards/no-filter";
import DEFAULT from "@/constants/default";
import FilterSort from "../list/filter-sort";
import useInView from "@/hooks/useInView";
import FilterSortHistories from "../list/filter-sort-histories";
import SwitchPageSmall from "../switch-page/small";

let isAtTheEnd = false;

export default function HistoryGrid({
  label,
  isLoading = false,
  children,
  onChangeParams,
  onClickLabel,
  onScrollToEnd,
  className,
}: {
  label: string | React.ReactNode;

  className?: string;
  isLoading?: boolean;
  children?: React.ReactNode[];

  onChangeParams?: (params: Params) => void;
  onClickLabel?: () => void;
  onScrollToEnd?: () => void;
}) {
  const [params, setParams] = useState<Params>(DEFAULT.params);
  const [isResetFilterSort, setIsResetFilterSort] = useState<boolean>(false);

  useEffect(() => {
    onChangeParams?.(params);
    setIsResetFilterSort(false);
  }, [params]);

  return (
    <div className={`w-full ${className}`}>
      {/* Header */}
      <div className=" w-full border-b-2">
        <h2 className="text-[2em] font-bold cursor-pointer mx-4" onClick={() => onClickLabel?.()}>
          {label}
        </h2>
      </div>

      {/* Main grid with sort */}
      <div className="flex flex-col gap-2 justify-start items-center py-2 w-full">
        {/* Sort and fiter */}
        {/* <FilterSortHistories className="w-full" onChange={setParams} isResetAll={isResetFilterSort}></FilterSortHistories> */}

        <div>
          {children && children.length > 0 ? (
            // Grid
            <div
              className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-3 lg:grid-cols-5 xl:grid-cols-7 gap-2
                border-b-2 border-foreground pb-2 w-full"
            >
              {children}
            </div>
          ) : (
            <NoFilterResult
              onResetFilter={() => {
                setParams(DEFAULT.params);
                setIsResetFilterSort(true);
              }}
            ></NoFilterResult>
          )}
          {isLoading && <Loading className="w-full p-10"></Loading>}
        </div>
      </div>
    </div>
  );
}
