import ButtonDropdownCheckbox from "../buttons/dropdown/btn-dropdown-checkbox";

import StarIcon from "@/public/star.svg";

import FilterProps from "@/types/filter";
import Tag from "../tags/tag";

const RATINGS = [
  {
    label: "Trên 4 sao",
    code: "4-6",
    isChecked: false,
  },
  {
    label: "Từ 3 đến 4 sao",
    code: "3-4",
    isChecked: false,
  },
  {
    label: "Từ 2 đến 3 sao",
    code: "2-3",
    isChecked: false,
  },
  {
    label: "Từ 1 đến 2 sao",
    code: "1-2",
    isChecked: false,
  },
  {
    label: "Dưới 1 sao",
    code: "0-1",
    isChecked: false,
  },
];

export default function FilterRatings({ onFilter, isReset = false }: { onFilter: ({}) => void; isReset?: boolean }) {
  const handleFilter = (value: FilterProps[]) => {
    let filter: string[] = [];
    value.forEach((v, i) => {
      if (v.isChecked) {
        filter.push(v.code || "");
      }
    });
    onFilter?.({ star: filter });
  };

  if (isReset) {
    RATINGS.forEach((rating) => {
      rating.isChecked = false;
    });
  }

  return (
    <ButtonDropdownCheckbox
      label={
        <div className="flex flex-row flex-wrap gap-1.5 justify-center items-center w-fit h-fit">
          <StarIcon className="w-5 h-5 fill-background-items stroke-foreground"></StarIcon>
          <p className="font-bold">Đánh giá</p>
          <div className="flex flex-row flex-wrap gap-1">{RATINGS?.map((rating, i) => rating.isChecked && <Tag key={rating.code}>{rating.label}</Tag>)}</div>
        </div>
      }
      options={RATINGS}
      name="filter-sort-author"
      onFinishCheck={(checked) => handleFilter?.(checked)}
    ></ButtonDropdownCheckbox>
  );
}
