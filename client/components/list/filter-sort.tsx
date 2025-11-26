import { useEffect, useRef, useState } from "react";

import FilterAuthors from "../filters/filter-authors";
import FilterGenres from "../filters/fiilter-genres";
import FilterRatings from "../filters/filter-ratings";
import FilterViews from "../filters/filter-views";
import SortStories from "../sorts/sort-stories";
import FilterProps from "@/types/filter";

interface FilterSortProps {
  onChange?: (params: {}) => void;
  isResetAll?: boolean;
  className?: string;
}

export default function FilterSort({ onChange, isResetAll, className }: FilterSortProps) {
  const [filter, setFilter] = useState({});
  const [sort, setSort] = useState({ sort: "created_at:desc" });
  // This is use to get data like author name, genre from server

  const handleFilter = (field: string, value: FilterProps[]) => {
    let temp: string[] = [];
    value.forEach((v, i) => {
      if (v.isChecked) {
        // temp = temp + v.code + ",";
        temp.push(v.code || "");
      }
    });

    setFilter((prev) => {
      return {
        ...prev,
        ...{
          [field]: temp,
        },
      };
    });
  };

  const handleSort = (
    value: {
      label: string;
      code?: string;
      isChecked: boolean;
    }[]
  ) => {
    value.forEach((v, i) => {
      if (v.isChecked) {
        setSort({ sort: v.code || "" });
        return;
      }
    });
  };

  // Auto call onChange when filter or sort are updated
  useEffect(() => {
    const params = {
      ...filter,
      ...sort,
    };
    onChange?.(params);
  }, [filter, sort]);

  useEffect(() => {
    setFilter({});
    onChange?.({ ...sort });
  }, [isResetAll]);

  return (
    <div className={`flex flex-row flex-wrap gap-2 ${className}`}>
      {/* Sort */}
      <SortStories onSort={(options) => handleSort(options)}></SortStories>

      {/* Rating */}
      <FilterRatings onFilter={(options) => handleFilter("star", options)} isReset={isResetAll}></FilterRatings>

      {/* Genre */}
      <FilterGenres onFilter={(options) => handleFilter("genre", options)} isReset={isResetAll}></FilterGenres>

      {/* Author */}
      <FilterAuthors onFilter={(options) => handleFilter("author", options)} isReset={isResetAll}></FilterAuthors>

      {/* View */}
      <FilterViews onFilter={(options) => handleFilter("view", options)} isReset={isResetAll}></FilterViews>
    </div>
  );
}
