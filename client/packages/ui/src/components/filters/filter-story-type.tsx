import BookIcon from "@/public/book.svg";

import SharpTriangleDownIcon from "@/public/sharp-triangle-down.svg";
import Tag from "../tags/tag";

import ButtonDropdown from "../buttons/dropdown/btn-dropdown";
import Checkbox from "../inputs/checkbox";
import { useEffect, useState } from "react";

const TYPE = [
  {
    label: "Manga",
    code: "manga",
  },
  {
    label: "Light novel",
    code: "light_novel",
  },
];

interface FilterStoryTypeProps {
  value: string[];
  onChange?: (value: string[]) => void;
}

export default function FilterStoryType({ value, onChange }: FilterStoryTypeProps) {
  const [types, setTypes] = useState<typeof TYPE>(() => TYPE.map((t) => ({ ...t })));
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

    TYPE.forEach((t, idx) => {
      if (selectedIndexs.has(idx)) result.push(t.code);
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
    TYPE.forEach((t, idx) => {
      if (valueSet.has(t.code as string)) selected.push(idx);
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
              <BookIcon className="w-5 h-5 "></BookIcon>
              <p className="font-bold">Loại truyện</p>
              <div className="flex flex-row flex-wrap gap-0.5">
                {types.map((type, i) => finalSelectedIndex.has(i) && <Tag key={type.code}>{type.label}</Tag>)}
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
        {types.map((type, index) => (
          <div key={index} className="flex w-full h-fit justify-start items-center">
            <Checkbox value={selectedIndexs.has(index)} onChange={(isChecked) => toggleCheckbox(index, isChecked)}>
              {type.label}
            </Checkbox>
          </div>
        ))}
      </div>
    </ButtonDropdown>
  );
}
