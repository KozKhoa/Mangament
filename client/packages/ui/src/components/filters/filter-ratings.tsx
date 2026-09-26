import StarIcon from "@/public/star.svg";

import SharpTriangleDownIcon from "@/public/sharp-triangle-down.svg";
import Tag from "../tags/tag";

import ButtonDropdown from "../buttons/dropdown/btn-dropdown";
import Checkbox from "../inputs/checkbox";
import { useEffect, useState } from "react";

const RATINGS = [
  {
    label: "Trên 4 sao",
    code: "4-6",
  },
  {
    label: "Từ 3 đến 4 sao",
    code: "3-4",
  },
  {
    label: "Từ 2 đến 3 sao",
    code: "2-3",
  },
  {
    label: "Từ 1 đến 2 sao",
    code: "1-2",
  },
  {
    label: "Dưới 1 sao",
    code: "0-1",
  },
];

interface FilterRatingsProps {
  value: string[];
  onChange?: (value: string[]) => void;
}

export default function FilterRatings({ value, onChange }: FilterRatingsProps) {
  const [ratings, setRatings] = useState(RATINGS.map((rating) => rating.label));

  const [selectedIndexs, setSelectedIndexs] = useState<Set<number>>(new Set());
  const [finalSelectedIndex, setFinalSelectedIndex] = useState<Set<number>>(new Set());

  function toggleCheckbox(index: number, checked: boolean) {
    const newSet = new Set(selectedIndexs);
    if (checked) {
      newSet.add(index);
    } else {
      newSet.delete(index);
    }
    setSelectedIndexs(newSet);
  }

  function handleFinish() {
    const result: string[] = [];

    RATINGS.forEach((r, idx) => {
      if (selectedIndexs.has(idx)) result.push(r.code);
    });

    setFinalSelectedIndex(new Set(selectedIndexs));
    onChange?.(result);
  }

  function resetAllField() {
    setSelectedIndexs(new Set());
    setFinalSelectedIndex(new Set());

    onChange?.([]);
  }

  useEffect(() => {
    const valueSet = new Set(value);

    const selected: number[] = [];

    RATINGS.forEach((r, idx) => {
      if (valueSet.has(r.code as string)) selected.push(idx);
    });

    setSelectedIndexs(new Set(selected));
    setFinalSelectedIndex(new Set(selected));
  }, [value]);

  return (
    <ButtonDropdown
      openOnLeft={true}
      className={`border-foreground/30 border rounded-sm relative text-foreground`}
      acceptButtonLabel="Finish"
      onClickAcceptButton={handleFinish}
      closeButtonLabel="Reset"
      onClickCloseButton={resetAllField}
      icon={
        <div className={`flex flex-row relative justify-start items-center gap-1.5 p-0.5 cursor-pointer w-fit text-foreground px-2 `}>
          {
            <div className="flex flex-row flex-wrap gap-1.5 justify-center items-center w-fit h-fit">
              <StarIcon className="w-5 h-5 fill-background-items stroke-foreground"></StarIcon>
              <p className="font-bold">Đánh giá</p>
              <div className="flex flex-row flex-wrap gap-0.5">{ratings.map((rating, i) => finalSelectedIndex.has(i) && <Tag key={rating}>{rating}</Tag>)}</div>
            </div>
          }
          <div className="w-[1em] h-[1em]">
            <SharpTriangleDownIcon className="w-[1em] h-[1em] text-foreground" />
          </div>
        </div>
      }
    >
      <div className="flex flex-col justify-start items-center gap-2.5 w-full h-fit">
        {ratings.map((rating, i) => (
          <div key={i} className="flex w-full h-fit justify-start items-center">
            <Checkbox value={selectedIndexs.has(i)} onChange={(isChecked) => toggleCheckbox(i, isChecked)}>
              {rating}
            </Checkbox>
          </div>
        ))}
      </div>
    </ButtonDropdown>
  );
}
