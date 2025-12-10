"use client";

import { useEffect, useRef, useState } from "react";

import Loading from "../loadings/loading";

import { Params, StoryParams } from "@/types/params";
import SortStories from "../sorts/sort-stories";

import FilterAuthors from "../filters/filter-authors";
import FilterGenres from "../filters/fiilter-genres";
import FilterRatings from "../filters/filter-ratings";
import FilterViews from "../filters/filter-views";
import NoFilterResult from "../cards/no-filter";
import DEFAULT from "@/constants/default";
import FilterSort from "../list/filter-sort";
import useInView from "@/hooks/useInView";

let isAtTheEnd = false;

export default function CardGrid({
  label,
  isLoading = false,
  children,
  onChangeParams,
  onClickLabel,
  onScrollToEnd,
  className,
}: {
  label: string;

  className?: string;
  isLoading?: boolean;
  children?: React.ReactNode[];

  onChangeParams?: (params: Params) => void;
  onClickLabel?: () => void;
  onScrollToEnd?: () => void;
}) {
  const isRunFirstTime = useRef<boolean>(true);
  const parentRef = useRef<HTMLDivElement>(null);
  const childRef = useRef<HTMLDivElement>(null);

  const { ref, inView } = useInView();

  const [params, setParams] = useState<Params>(DEFAULT.params);
  const [isResetFilterSort, setIsResetFilterSort] = useState<boolean>(false);

  useEffect(() => {
    if (isRunFirstTime.current) {
      isRunFirstTime.current = false;
      return;
    }

    onChangeParams?.(params);
    setIsResetFilterSort(false);
  }, [params]);

  useEffect(() => {
    if (inView) {
      onScrollToEnd?.();
    }
  }, [inView]);

  return (
    <div className={`w-full ${className}`}>
      {/* Header */}
      <div className=" w-full border-b-2 ">
        <h2 className="text-[2em] font-bold cursor-pointer" onClick={() => onClickLabel?.()}>
          {label}
        </h2>
      </div>

      {/* Main grid with sort */}
      <div className="flex flex-col gap-2 justify-start items-center py-2 w-full">
        {/* Sort and fiter */}
        <FilterSort className="w-full" onChange={setParams} isResetAll={isResetFilterSort}></FilterSort>

        <div ref={parentRef}>
          {children && children.length > 0 ? (
            // Grid
            <div
              ref={childRef}
              className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-3 lg:grid-cols-5 xl:grid-cols-6 gap-2
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

        {/* This is use to determine is grid inview or not */}
        <div ref={ref as any}></div>
      </div>
    </div>
  );
}
