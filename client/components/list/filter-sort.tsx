import { useEffect, useRef, useState } from "react";

import FilterAuthors from "../filters/filter-authors";
import FilterGenres from "../filters/fiilter-genres";
import FilterRatings from "../filters/filter-ratings";
import FilterViews from "../filters/filter-views";
import FilterStoryType from "../filters/filter-story-type";
import SortTime from "../sorts/sort-time";
import { Params } from "@/types/params";
import DEFAULT from "@/constants/default";

export default function FilterSort({ onChange, isResetAll = false, className }: { onChange?: (params: {}) => void; isResetAll?: boolean; className?: string }) {
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
      <SortTime onSort={updateParams}></SortTime>

      {/* Rating */}
      {/* <FilterRatings onFilter={updateParams} isReset={isResetAll}></FilterRatings> */}

      {/* Genre */}
      {/* <FilterGenres onFilter={updateParams} isReset={isResetAll}></FilterGenres> */}

      {/* Author */}
      {/* <FilterAuthors onFilter={updateParams} isReset={isResetAll}></FilterAuthors> */}

      {/* View */}
      {/* <FilterViews onFilter={updateParams} isReset={isResetAll}></FilterViews> */}

      {/* Story type */}
      <FilterStoryType onFilter={updateParams} isReset={isResetAll}></FilterStoryType>
    </div>
  );
}
