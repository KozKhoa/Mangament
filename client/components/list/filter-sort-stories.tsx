import { useEffect, useRef, useState } from "react";

import FilterAuthors from "../filters/filter-authors";
import FilterGenres from "../filters/fiilter-genres";
import FilterRatings from "../filters/filter-ratings";
import FilterViews from "../filters/filter-views";
import SortStories from "../sorts/sort-stories";
import FilterProps from "@/types/filter";
import { Params } from "@/types/params";
import DEFAULT from "@/constants/default";

export default function FilterSortStories({
  onChange,
  isResetAll = false,
  className,
}: {
  onChange?: (params: {}) => void;
  isResetAll?: boolean;
  className?: string;
}) {
  const isRunFirstTime = useRef(true);

  const [params, setParams] = useState<Params>(DEFAULT.params);

  function updateParams(params: {}) {
    setParams((oldParams) => ({ ...oldParams, ...params }));
  }

  // Auto call onChange when filter or sort are updated
  useEffect(() => {
    if (isRunFirstTime.current) {
      isRunFirstTime.current = false;
      return;
    }

    onChange?.(params);
  }, [params]);

  useEffect(() => {
    if (isResetAll) {
      setParams(DEFAULT.params);
    }
  }, [isResetAll]);

  return (
    <div className={`flex flex-row flex-wrap gap-2 ${className}`}>
      {/* Sort */}
      <SortStories onSort={updateParams}></SortStories>

      {/* Rating */}
      <FilterRatings onFilter={updateParams} isReset={isResetAll}></FilterRatings>

      {/* Genre */}
      <FilterGenres onFilter={updateParams} isReset={isResetAll}></FilterGenres>

      {/* Author */}
      <FilterAuthors onFilter={updateParams} isReset={isResetAll}></FilterAuthors>

      {/* View */}
      <FilterViews onFilter={updateParams} isReset={isResetAll}></FilterViews>
    </div>
  );
}
