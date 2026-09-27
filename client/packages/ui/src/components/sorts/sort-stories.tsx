import { useEffect, useState } from "react";
import ButtonDropdownRadio from "../buttons/dropdown/btn-drop-down-radio";

import SortIcon from "@/public/sort.svg";

const SORTS = [
  {
    label: "Mới nhất",
    code: "updated_at:desc",
    isChecked: false,
  },
  {
    label: "Cũ nhất",
    code: "updated_at:asc",
    isChecked: false,
  },
  {
    label: "View tăng dần",
    code: "view:asc",
    isChecked: false,
  },
  {
    label: "View giảm dần",
    code: "view:desc",
    isChecked: false,
  },
  {
    label: "Số sao tăng dần",
    code: "star:asc",
    isChecked: false,
  },
  {
    label: "Số sao giảm dần",
    code: "star:desc",
    isChecked: false,
  },
];

const SORT_LABEL = SORTS.map((sort) => sort.label);

export default function SortStories({ value, onSort }: { value: string; onSort?: (sort: string) => void }) {
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);

  function handleChange(index: number) {
    setSelectedIndex(index);
    onSort?.(SORTS[index].code);
  }

  useEffect(() => {
    const find = SORTS.findIndex((sort) => sort.code === value);

    setSelectedIndex(find < 0 ? null : find);
  }, [value]);

  return (
    <ButtonDropdownRadio
      label={
        <div className="flex flex-row flex-wrap gap-1.5 justify-center items-center w-fit h-fit">
          <SortIcon className="w-5 h-5 text-foreground stroke-0"></SortIcon>
          <p className="font-bold">Sắp xếp: </p>
          <div className="flex flex-row flex-wrap gap-2">{selectedIndex !== null ? SORTS[selectedIndex].label : ""}</div>
        </div>
      }
      options={SORT_LABEL}
      name="filter-sort-author"
      selectedIndex={selectedIndex}
      onChange={handleChange}
    ></ButtonDropdownRadio>
  );
}
