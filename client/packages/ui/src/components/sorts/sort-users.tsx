import { useEffect, useState } from "react";
import ButtonDropdownRadio from "../buttons/dropdown/btn-drop-down-radio";

import SortIcon from "@/public/sort.svg";

const SORTS = [
  {
    label: "Tài khoản mới trước",
    code: "join_date:desc",
  },
  {
    label: "Tài khoản cũ trước",
    code: "join_date:asc",
  },
  {
    label: "Tên A-Z",
    code: "name:asc",
  },
  {
    label: "Tên Z-A",
    code: "name:desc",
  },
  {
    label: "Email A-Z",
    code: "email:asc",
  },
  {
    label: "Email Z-A",
    code: "email:desc",
  },
];

const SORT_LABEL = SORTS.map((sort) => sort.label);

export default function SortUsers({ value, onSort }: { value: string; onSort?: (sort: string) => void }) {
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
          <div className="flex flex-row flex-wrap gap-2">{SORTS?.map((sort, i) => selectedIndex === i && <p key={sort.code}>{sort.label}</p>)}</div>
        </div>
      }
      options={SORT_LABEL}
      selectedIndex={selectedIndex}
      name="filter-sort-author"
      onChange={(index) => onSort?.(SORTS[index].code)}
    ></ButtonDropdownRadio>
  );
}
