import StarIcon from "@/public/star.svg";
import TickIcon from "@/public/tick-o.svg";

import SharpTriangleDownIcon from "@/public/sharp-triangle-down.svg";
import Tag from "../tags/tag";

import ButtonDropdown from "../buttons/dropdown/btn-dropdown";
import Checkbox from "../inputs/checkbox";
import { useEffect, useState } from "react";

export type TargetStoryStatus = "0-1" | "1-2" | "2-3" | "3-4" | "4-6" | null;

const STATUS = [
  {
    label: "Đang tiếp tục",
    code: "ongoing",
    isChecked: false,
  },
  {
    label: "Hoàn thành",
    code: "finished",
    isChecked: false,
  },
  {
    label: "Trì hoãn",
    code: "postpone",
    isChecked: false,
  },
  {
    label: "Sắp ra mắt",
    code: "upcoming",
    isChecked: false,
  },
];

interface FilterStoryStatusProps {
  value: TargetStoryStatus[];
  onChange?: (value: TargetStoryStatus[]) => void;
}

export default function FilterStoryStatus({ value, onChange }: FilterStoryStatusProps) {
  const [rerender, setRerender] = useState(false); // This only use to force this component re render to update items

  function handleFinish() {
    setRerender(!rerender);
    onChange?.(STATUS.filter((status) => status.isChecked).map((status) => status.code as TargetStoryStatus));
  }

  function resetAllField() {
    STATUS.forEach((status) => {
      status.isChecked = false;
    });
    handleFinish();
  }

  useEffect(() => {
    STATUS.forEach((ratings) => {
      if (value.includes(ratings.code as TargetStoryStatus)) {
        ratings.isChecked = true;
      } else {
        ratings.isChecked = false;
      }
    });
  }, [value]);

  return (
    <ButtonDropdown
      openOnLeft={true}
      className={`border-foreground border rounded-[5] relative text-foreground`}
      acceptButtonLabel="Finish"
      onClickAcceptButton={handleFinish}
      closeButtonLabel="Reset"
      onClickCloseButton={resetAllField}
      icon={
        <div className={`flex flex-row relative justify-start items-center gap-1.5 p-0.5 cursor-pointer w-fit text-foreground px-2 `}>
          {
            <div className="flex flex-row flex-wrap gap-1.5 justify-center items-center w-fit h-fit">
              <TickIcon className="w-5 h-5 "></TickIcon>
              <p className="font-bold">Tiến độ</p>
              <div className="flex flex-row flex-wrap gap-0.5">
                {STATUS?.map((status, i) => status.isChecked && <Tag key={status.code}>{status.label}</Tag>)}
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
        {STATUS?.map((status, index) => (
          <div key={index} className="flex w-full h-fit justify-start items-center">
            <Checkbox defaultChecked={status.isChecked} onChange={(isChecked) => (status.isChecked = isChecked)}>
              {status.label}
            </Checkbox>
          </div>
        ))}
      </div>
    </ButtonDropdown>
  );
}
