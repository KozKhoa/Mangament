import EyeIcon from "@/public/eye/open.svg";

import SharpTriangleDownIcon from "@/public/sharp-triangle-down.svg";
import Tag from "../tags/tag";

import ButtonDropdown from "../buttons/dropdown/btn-dropdown";
import Checkbox from "../inputs/checkbox";
import React, { useEffect, useState } from "react";

const VIEWS = [
  {
    label: "Trên 1 triệu view",
    code: "1000000-2147483647",
  },
  {
    label: "Từ 500.000 đến 1 triệu view",
    code: "500000-1000000",
  },
  {
    label: "Từ 100.000 đến 500.000 view",
    code: "100000-500000",
  },
  {
    label: "Từ 50.000 đến 100.000 view",
    code: "50000-100000",
  },
  {
    label: "Từ 10.000 đến 50.000 view",
    code: "10000-50000",
  },
  {
    label: "Từ 1.000 đến 10.000 view",
    code: "1000-10000",
  },
  {
    label: "Dưới 1.000 view",
    code: "0-1000",
  },
];

interface FilterViewProps {
  value: string[];
  onChange?: (value: string[]) => void;
}

const FilterViews = React.memo(({ value, onChange }: FilterViewProps) => {
  const [views, setViews] = useState(VIEWS.map((view) => view.label));

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

    VIEWS.forEach((view, idx) => {
      if (selectedIndexs.has(idx)) result.push(view.code);
    });

    setFinalSelectedIndex(new Set(selectedIndexs));
    onChange?.(result);
  }

  function resetAllField() {
    onChange?.([]);

    setSelectedIndexs(new Set());
    setFinalSelectedIndex(new Set());
  }

  useEffect(() => {
    const selected: number[] = [];

    const valueSet = new Set(value);

    let i = 0;
    for (const view of VIEWS) {
      if (valueSet.has(view.code)) selected.push(i);
      i++;
    }

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
              <EyeIcon className="w-5 h-5 text-foreground stroke-0"></EyeIcon>
              <p className="font-bold">Lượt xem</p>
              <div className="flex flex-row flex-wrap gap-0.5">{views.map((view, i) => finalSelectedIndex.has(i) && <Tag key={view}>{view}</Tag>)}</div>
            </div>
          }
          <div className="w-[1em] h-[1em]">
            <SharpTriangleDownIcon className="w-[1em] h-[1em] text-foreground" />
          </div>
        </div>
      }
    >
      <div className="flex flex-col justify-start items-center gap-2.5 w-full h-fit">
        {views.map((view, i) => (
          <div key={i} className="flex w-full h-fit justify-start items-center">
            <Checkbox value={selectedIndexs.has(i)} onChange={(isChecked) => toggleCheckbox(i, isChecked)}>
              {view}
            </Checkbox>
          </div>
        ))}
      </div>
    </ButtonDropdown>
  );
});

export default FilterViews;
