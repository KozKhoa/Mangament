import BookIcon from "@/public/book.svg";

import SharpTriangleDownIcon from "@/public/sharp-triangle-down.svg";
import Tag from "../tags/tag";

import ButtonDropdown from "../buttons/dropdown/btn-dropdown";
import Checkbox from "../inputs/checkbox";
import { useEffect, useState } from "react";

export type TargetStoryType = "manga" | "light_novel" | null;

const TYPE = [
  {
    label: "Manga",
    code: "manga",
    isChecked: false,
  },
  {
    label: "Light novel",
    code: "light_novel",
    isChecked: false,
  },
];

interface FilterStoryTypeProps {
  value: TargetStoryType[];
  onChange?: (value: TargetStoryType[]) => void;
}

export default function FilterStoryType({ value, onChange }: FilterStoryTypeProps) {
  const [rerender, setRerender] = useState(false); // This only use to force this component re render to update items

  function handleFinish() {
    setRerender(!rerender);
    onChange?.(TYPE.filter((type) => type.isChecked).map((type) => type.code as TargetStoryType));
  }

  function resetAllField() {
    TYPE.forEach((type) => {
      type.isChecked = false;
    });
    handleFinish();
  }

  useEffect(() => {
    TYPE.forEach((ratings) => {
      if (value.includes(ratings.code as TargetStoryType)) {
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
              <BookIcon className="w-5 h-5 "></BookIcon>
              <p className="font-bold">Loại truyện</p>
              <div className="flex flex-row flex-wrap gap-0.5">{TYPE?.map((type, i) => type.isChecked && <Tag key={type.code}>{type.label}</Tag>)}</div>
            </div>
          }
          <div className="w-[1em] h-[1em]">
            <SharpTriangleDownIcon className="w-[1em] h-[1em] text-foreground" />
          </div>
        </div>
      }
    >
      <div className="flex flex-col justify-start items-center gap-2.5 w-full h-fit">
        {TYPE?.map((type, index) => (
          <div key={index} className="flex w-full h-fit justify-start items-center">
            <Checkbox defaultChecked={type.isChecked} onChange={(isChecked) => (type.isChecked = isChecked)}>
              {type.label}
            </Checkbox>
          </div>
        ))}
      </div>
    </ButtonDropdown>
  );
}
