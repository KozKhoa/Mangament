import ButtonDropdownCheckbox from "../buttons/dropdown/btn-dropdown-checkbox";

import EyeIcon from "@/public/eye/open.svg";

import FilterProps from "@/types/filter";
import { useEffect } from "react";
import Tag from "../tags/tag";

interface FilterViewsProps {
  onFilter?: (options: FilterProps[]) => void;
  isReset?: boolean;
  className?: string;
}

const VIEWS = [
  {
    label: "Trên 1 triệu view",
    code: "1000000-2147483647",
    isChecked: false,
  },
  {
    label: "Từ 500.000 đến 1 triệu view",
    code: "500000-1000000",
    isChecked: false,
  },

  {
    label: "Từ 100.000 đến 500.000 view",
    code: "100000-500000",
    isChecked: false,
  },
  {
    label: "Từ 50.000 đến 100.000 view",
    code: "50000-100000",
    isChecked: false,
  },
  {
    label: "Từ 10.000 đến 50.000 view",
    code: "10000-50000",
    isChecked: false,
  },
  {
    label: "Từ 1.000 đến 10.000 view",
    code: "1000-10000",
    isChecked: false,
  },
  {
    label: "Dưới 1.000 view",
    code: "0-1000",
    isChecked: false,
  },
];

export default function FilterViews({ onFilter, isReset }: { onFilter?: ({}) => void; isReset: boolean }) {
  const handleFilter = (value: FilterProps[]) => {
    let filter: string[] = [];
    value.forEach((v, i) => {
      if (v.isChecked) {
        filter.push(v.code || "");
      }
    });
    onFilter?.({ view: filter });
  };

  useEffect(() => {
    VIEWS.forEach((view) => {
      view.isChecked = false;
    });
  }, [isReset]);

  return (
    <ButtonDropdownCheckbox
      label={
        <div className="flex flex-row flex-wrap gap-1.5 justify-center items-center w-fit h-fit">
          <EyeIcon className="w-5 h-5 text-foreground stroke-0"></EyeIcon>
          <p className="font-bold">Lượt xem</p>
          <div className="flex flex-row flex-wrap gap-2">{VIEWS?.map((view, i) => view.isChecked && <Tag key={view.code}>{view.label}</Tag>)}</div>
        </div>
      }
      options={VIEWS}
      name="filter-sort-author"
      onFinishCheck={(checked) => handleFilter?.(checked)}
    ></ButtonDropdownCheckbox>
  );
}
