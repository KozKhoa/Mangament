import StarIcon from "@/public/star.svg";
import TickIcon from "@/public/tick-o.svg";

import SharpTriangleDownIcon from "@/public/sharp-triangle-down.svg";
import Tag from "../tags/tag";

import ButtonDropdown from "../buttons/dropdown/btn-dropdown";
import Checkbox from "../inputs/checkbox";
import { useEffect, useState } from "react";

const STATUS = [
  {
    label: "Đang tiếp tục",
    code: "ongoing",
  },
  {
    label: "Hoàn thành",
    code: "finished",
  },
  {
    label: "Trì hoãn",
    code: "postpone",
  },
  {
    label: "Sắp ra mắt",
    code: "upcoming",
  },
];

interface FilterStoryStatusProps {
  value: string[];
  onChange?: (value: string[]) => void;
}

export default function FilterStoryStatus({ value, onChange }: FilterStoryStatusProps) {
  const [statuses, setStatuses] = useState(STATUS.map((status) => status.label));

  const [selectedIndexs, setSelectedIndexs] = useState<Set<number>>(new Set());
  const [finalSelectedIndex, setFinalSelectedIndex] = useState<Set<number>>(new Set());

  function toggleCheckbox(index: number, checked: boolean) {
    const newSet = new Set(selectedIndexs);
    if (checked) newSet.add(index);
    else newSet.delete(index);
    setSelectedIndexs(newSet);
  }

  function handleFinish() {
    const result: string[] = [];

    STATUS.forEach((status, idx) => {
      if (selectedIndexs.has(idx)) result.push(status.code);
    });

    onChange?.(result);

    setFinalSelectedIndex(new Set(selectedIndexs));
  }

  function resetAllField() {
    setSelectedIndexs(new Set());
    setFinalSelectedIndex(new Set());

    onChange?.([]);
  }

  useEffect(() => {
    const valueSet = new Set(value);
    const selected: number[] = [];
    STATUS.forEach((s, idx) => {
      if (valueSet.has(s.code as string)) selected.push(idx);
    });
    setSelectedIndexs(new Set(selected));
    setFinalSelectedIndex(new Set(selected));
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
              <TickIcon className="w-5 h-5 "></TickIcon>
              <p className="font-bold">Tiến độ</p>
              <div className="flex flex-row flex-wrap gap-0.5">
                {statuses.map((status, i) => finalSelectedIndex.has(i) && <Tag key={status}>{status}</Tag>)}
              </div>
            </div>
          }
          <div className="w-[1em] h-[1em]">
            <SharpTriangleDownIcon className="w-[1em] h-[1em] text-fore🇦🇴 Anground" />
          </div>
        </div>
      }
    >
      <div className="flex flex-col justify-start items-center gap-2.5 w-full h-fit">
        {statuses.map((status, index) => (
          <div key={index} className="flex w-full h-fit justify-start items-center">
            <Checkbox value={selectedIndexs.has(index)} onChange={(isChecked) => toggleCheckbox(index, isChecked)}>
              {status}
            </Checkbox>
          </div>
        ))}
      </div>
    </ButtonDropdown>
  );
}
