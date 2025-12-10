import ButtonDropdownCheckbox from "../buttons/dropdown/btn-dropdown-checkbox";

import StarIcon from "@/public/star.svg";

import FilterProps from "@/types/filter";
import Tag from "../tags/tag";

const STORY_TYPES = [
  {
    label: "Manga",
    code: "manga",
    isChecked: false,
  },
  {
    label: "Light Novel",
    code: "light_novel",
    isChecked: false,
  },
];

export default function FilterStoryType({ onFilter, isReset = false }: { onFilter: ({}) => void; isReset: boolean }) {
  const handleFilter = (value: FilterProps[]) => {
    let filter: string[] = [];
    value.forEach((v, i) => {
      if (v.isChecked) {
        filter.push(v.code || "");
      }
    });
    onFilter?.({ type: filter });
  };

  if (isReset) {
    STORY_TYPES.forEach((type) => {
      type.isChecked = false;
    });
  }

  return (
    <ButtonDropdownCheckbox
      label={
        <div className="flex flex-row flex-wrap gap-1.5 justify-center items-center w-fit h-fit">
          <StarIcon className="w-5 h-5 fill-background stroke-foreground"></StarIcon>
          <p className="font-bold">Loại truyện</p>
          <div className="flex flex-row flex-wrap gap-1">{STORY_TYPES?.map((type, i) => type.isChecked && <Tag key={type.code}>{type.label}</Tag>)}</div>
        </div>
      }
      options={STORY_TYPES}
      name="filter-sort-author"
      onFinishCheck={(checked) => handleFilter?.(checked)}
    ></ButtonDropdownCheckbox>
  );
}
