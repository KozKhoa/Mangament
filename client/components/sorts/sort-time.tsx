import { useEffect, useRef, useState } from "react";
import ButtonDropdownRadio from "../buttons/dropdown/btn-drop-down-radio";

import SortIcon from "@/public/sort.svg";

export default function SortTime({
  value,
  onSort,
  sortKey = "updated_at",
}: {
  value: string;
  onSort?: (sort: string) => void;
  sortKey?: "updated_at" | "created_at";
}) {
  const SORTS = [
    { label: "Mới nhất", code: `${sortKey}:desc` },
    { label: "Cũ nhất", code: `${sortKey}:asc` },
  ];
  const SORT_LABEL = useRef(SORTS.map((sort) => sort.label));

  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);

  function handleChange(index: number) {
    setSelectedIndex(index);
    onSort?.(SORTS[index].code);
  }

  useEffect(() => {
    const find = SORTS.findIndex((sort) => sort.code === value);
    setSelectedIndex(find < 0 ? null : find);
  }, [SORTS, value]);

  return (
    <ButtonDropdownRadio
      label={
        <div className="flex flex-row flex-wrap gap-1.5 justify-center items-center w-fit h-fit">
          <SortIcon className="w-5 h-5 text-foreground stroke-0"></SortIcon>
          <p className="font-bold">Sắp xếp: </p>
          <div className="flex flex-row flex-wrap gap-2">{SORTS?.map((sort, i) => selectedIndex === i && <p key={sort.code}>{sort.label}</p>)}</div>
        </div>
      }
      options={SORT_LABEL.current}
      name="filter-sort-author"
      selectedIndex={selectedIndex}
      onChange={handleChange}
    ></ButtonDropdownRadio>
  );
}
