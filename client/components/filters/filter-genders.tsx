import SharpTriangleDownIcon from "@/public/sharp-triangle-down.svg";
import GenderIcon from "@/public/gender.svg";
import Tag from "../tags/tag";

import ButtonDropdown from "../buttons/dropdown/btn-dropdown";
import Checkbox from "../inputs/checkbox";
import { useEffect, useState } from "react";
import GenderTag from "../tags/gender-tag";

const GENDERS = [
  {
    label: "Nam",
    code: "male",
  },
  {
    label: "Nữ",
    code: "female",
  },
  {
    label: "Khác",
    code: "other",
  },
];

interface FilterGendersProps {
  value: string[];
  onChange?: (value: string[]) => void;
}

export default function FilterGenders({ value, onChange }: FilterGendersProps) {
  const [genders, setGenders] = useState(GENDERS.map((gender) => gender.label));

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

    GENDERS.forEach((gender, idx) => {
      if (selectedIndexs.has(idx)) result.push(gender.code);
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

    GENDERS.forEach((g, idx) => {
      if (valueSet.has(g.code)) selected.push(idx);
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
              <GenderIcon className="w-5 h-5 fill-background-items stroke-foreground"></GenderIcon>
              <p className="font-bold">Giới tính</p>
              <div className="flex flex-row flex-wrap gap-0.5">{genders.map((gender, i) => finalSelectedIndex.has(i) && <Tag key={gender}>{gender}</Tag>)}</div>
            </div>
          }
          <div className="w-[1em] h-[1em]">
            <SharpTriangleDownIcon className="w-[1em] h-[1em] text-foreground" />
          </div>
        </div>
      }
    >
      <div className="flex flex-col justify-start items-center gap-2.5 w-full h-fit">
        {genders.map((gender, i) => (
          <div key={i} className="flex w-full h-fit justify-start items-center">
            <Checkbox value={selectedIndexs.has(i)} onChange={(isChecked) => toggleCheckbox(i, isChecked)}>
              {gender}
            </Checkbox>
          </div>
        ))}
      </div>
    </ButtonDropdown>
  );
}
