import SharpTriangleDownIcon from "@/public/sharp-triangle-down.svg";
import GenderIcon from "@/public/gender.svg";
import Tag from "../tags/tag";

import ButtonDropdown from "../buttons/dropdown/btn-dropdown";
import Checkbox from "../inputs/checkbox";
import { useEffect, useState } from "react";

export type TargetGender = "male" | "female" | "other" | null;

const GENDERS = [
  {
    label: "Nam",
    code: "male",
    isChecked: false,
  },
  {
    label: "Nữ",
    code: "female",
    isChecked: false,
  },
  {
    label: "Khác",
    code: "other",
    isChecked: false,
  },
];

interface FilterGendersProps {
  value: TargetGender[];
  onChange?: (value: TargetGender[]) => void;
}

export default function FilterGenders({ value, onChange }: FilterGendersProps) {
  const [rerender, setRerender] = useState(false); // This only use to force this component re render to update items

  function handleFinish() {
    setRerender(!rerender);
    onChange?.(GENDERS.filter((gender) => gender.isChecked).map((gender) => gender.code as TargetGender));
  }

  function resetAllField() {
    GENDERS.forEach((gender) => {
      gender.isChecked = false;
    });
    handleFinish();
  }

  useEffect(() => {
    GENDERS.forEach((gender) => {
      if (value.includes(gender.code as TargetGender)) {
        gender.isChecked = true;
      } else {
        gender.isChecked = false;
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
              <GenderIcon className="w-5 h-5 fill-background-items stroke-foreground"></GenderIcon>
              <p className="font-bold">Giới tính</p>
              <div className="flex flex-row flex-wrap gap-0.5">
                {GENDERS?.map((gender, i) => gender.isChecked && <Tag key={gender.code}>{gender.label}</Tag>)}
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
        {GENDERS?.map((gender, index) => (
          <div key={index} className="flex w-full h-fit justify-start items-center">
            <Checkbox defaultChecked={gender.isChecked} onChange={(isChecked) => (gender.isChecked = isChecked)}>
              {gender.label}
            </Checkbox>
          </div>
        ))}
      </div>
    </ButtonDropdown>
  );
}
