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

export default function SortStories({ onSort }: { onSort?: ({ sort }: { sort: string }) => void }) {
  function handleSort(
    value: {
      label: string;
      code?: string;
      isChecked: boolean;
    }[],
  ) {
    value.forEach((v, i) => {
      if (v.isChecked) {
        onSort?.({ sort: v.code || "" });
        return;
      }
    });
  }

  return (
    <ButtonDropdownRadio
      label={
        <div className="flex flex-row flex-wrap gap-1.5 p-0.5 justify-center items-center w-fit h-fit">
          <SortIcon className="w-5 h-5 text-foreground stroke-0"></SortIcon>
          <p className="font-bold">Sắp xếp: </p>
          <div className="flex flex-row flex-wrap gap-2">{SORTS?.map((sort, i) => sort.isChecked && <p key={sort.code}>{sort.label}</p>)}</div>
        </div>
      }
      options={SORTS}
      name="filter-sort-author"
      onFinishCheck={handleSort}
    ></ButtonDropdownRadio>
  );
}
