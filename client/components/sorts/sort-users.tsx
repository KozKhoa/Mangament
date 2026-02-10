import { useEffect, useState } from "react";
import ButtonDropdownRadio from "../buttons/dropdown/btn-drop-down-radio";

import SortIcon from "@/public/sort.svg";

const SORTS = [
  {
    label: "Tài khoản mới trước",
    code: "join_date:desc",
    isChecked: true,
  },
  {
    label: "Tài khoản cũ trước",
    code: "join_date:asc",
    isChecked: false,
  },
  {
    label: "Tên A-Z",
    code: "name:asc",
    isChecked: false,
  },
  {
    label: "Tên Z-A",
    code: "name:desc",
    isChecked: false,
  },
  {
    label: "Email A-Z",
    code: "email:asc",
    isChecked: false,
  },
  {
    label: "Email Z-A",
    code: "email:desc",
    isChecked: false,
  },
];

export default function SortUsers({ value, onSort }: { value: string; onSort?: (sort: string) => void }) {
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);

  function handleSort(
    value: {
      label: string;
      code?: string;
      isChecked: boolean;
    }[],
  ) {
    value.forEach((v, i) => {
      if (v.isChecked) {
        onSort?.(v.code ?? "");
        return;
      }
    });
  }

  useEffect(() => {
    if (value === null || value === undefined) setSelectedIndex(null);
    else {
      SORTS.forEach((sort, i) => {
        if (sort.code == value) {
          setSelectedIndex(i);
        }
      });
    }
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
      options={SORTS}
      name="filter-sort-author"
      onFinishCheck={handleSort}
    ></ButtonDropdownRadio>
  );
}
