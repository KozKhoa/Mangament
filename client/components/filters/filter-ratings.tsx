import StarIcon from "@/public/star.svg";

import SharpTriangleDownIcon from "@/public/sharp-triangle-down.svg";
import Tag from "../tags/tag";

import ButtonDropdown from "../buttons/dropdown/btn-dropdown";
import Checkbox from "../inputs/checkbox";
import { useEffect, useState } from "react";

export type TargetRating = "0-1" | "1-2" | "2-3" | "3-4" | "4-6" | null;

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

interface FilterRatingsProps {
  value: TargetRating[];
  onChange?: (value: TargetRating[]) => void;
}

export default function FilterRatings({ value, onChange }: FilterRatingsProps) {
  const [rerender, setRerender] = useState(false); // This only use to force this component re render to update items

  function handleFinish() {
    setRerender(!rerender);
    onChange?.(RATINGS.filter((rating) => rating.isChecked).map((rating) => rating.code as TargetRating));
  }

  function resetAllField() {
    RATINGS.forEach((rating) => {
      rating.isChecked = false;
    });
    handleFinish();
  }

  useEffect(() => {
    RATINGS.forEach((ratings) => {
      if (value.includes(ratings.code as TargetRating)) {
        ratings.isChecked = true;
      } else {
        ratings.isChecked = false;
      }
    });
  }, [value]);

  return (
    <ButtonDropdown
      openOnLeft={true}
      className={`border-foreground/50 border rounded-[5] relative text-foreground`}
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
              <div className="flex flex-row flex-wrap gap-0.5">
                {RATINGS?.map((rating, i) => rating.isChecked && <Tag key={rating.code}>{rating.label}</Tag>)}
              </div>
            </div>
          }
          <div className="w-[1em] h-[1em]">
            <SharpTriangleDownIcon className="w-[1em] h-[1em] text-foreground" />
          </div>
        </div>
      }
    >
      <div className="flex flex-col justify-start items-center gap-2.5 w-full h-fit">
        {RATINGS?.map((rating, index) => (
          <div key={index} className="flex w-full h-fit justify-start items-center">
            <Checkbox defaultChecked={rating.isChecked} onChange={(isChecked) => (rating.isChecked = isChecked)}>
              {rating.label}
            </Checkbox>
          </div>
        ))}
      </div>
    </ButtonDropdown>
  );
}
