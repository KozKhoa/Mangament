import { useEffect, useState } from "react";
import ButtonDropdownRadio from "../buttons/dropdown/btn-drop-down-radio";

import SortIcon from "@/public/sort.svg";

const SORTS = [
  {
    label: "Mới nhất",
    code: "updated_at:desc",
    isChecked: true,
  },
  {
    label: "Cũ nhất",
    code: "updated_at:asc",
    isChecked: false,
  },
];

const SORT_LABEL = SORTS.map((sort) => sort.label);

export default function SortTime({ value, onSort }: { value: string; onSort?: (sort: string) => void }) {
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);

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
          <div className="flex flex-row flex-wrap gap-2">{SORTS?.map((sort, i) => sort.isChecked && <p key={sort.code}>{sort.label}</p>)}</div>
        </div>
      }
      options={SORT_LABEL}
      name="filter-sort-author"
      selectedIndex={selectedIndex}
      onChange={(index) => onSort?.(SORTS[index].code)}
    ></ButtonDropdownRadio>
  );
}
