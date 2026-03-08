"use client";

import React, { useEffect, useRef, useState } from "react";

import ButtonDropdown from "./btn-dropdown";

import SharpTriangleDownIcon from "@/public/sharp-triangle-down.svg";

import Radio from "@/components/inputs/radio";

interface ButtonFilterOption {
  label: string;
  isChecked: boolean;
  code?: string;
  [key: string]: any;
}

interface ButtonFilterProps {
  onFinishCheck?: (selectedOption: ButtonFilterOption[]) => void;
  label?: string | React.ReactNode;
  options?: ButtonFilterOption[];
  className?: string;
  name: string;
}

function ButtonDropdownRadio({ onFinishCheck, name, label, options, className }: ButtonFilterProps) {
  const [rerender, setRerender] = useState(false); // This only use to force this component re render to update items
  const [selected, setSelected] = useState<number>(0);

  const [selections, setSelections] = useState<ButtonFilterOption[]>(options ?? []);

  const handleUpdateSelected = (item: ButtonFilterOption, index: number, isChecked: boolean) => {
    setSelected(index);
  };

  const handleFinish = () => {
    // Reset all value for options
    if (selections) {
      selections.forEach((item) => (item.isChecked = false));
    }

    // Update new selection for items
    if (selections && selections[selected]) {
      selections[selected].isChecked = true;
    }
    selections && onFinishCheck?.(selections);
    setRerender(!rerender); // only use to rerender this component
  };

  useEffect(() => {
    setSelections(selections ?? []);
  }, [selections]);

  return (
    <ButtonDropdown
      openOnLeft={true}
      className={`border-foreground/50 border rounded-[5] py-[3px] text-foreground ${className}`}
      acceptButtonLabel="Finish"
      onClickAcceptButton={handleFinish}
      icon={
        <div
          className={`flex flex-row relative justify-start items-center gap-1.5 cursor-pointer w-fit
          text-foreground px-2 
        ${className}`}
        >
          {label && label}
          <div className="w-[1em] h-[1em]">
            <SharpTriangleDownIcon className="w-[1em] h-[1em] text-foreground" />
          </div>
        </div>
      }
    >
      <ul className="flex flex-col justify-start items-center gap-2.5 w-full h-fit">
        {selections?.map((item, index) => {
          return (
            <li key={index} className="flex w-full h-fit justify-start items-center">
              <Radio
                key={index}
                defaultChecked={item.isChecked}
                name={name}
                value={item.label}
                onChange={(isChecked) => handleUpdateSelected(item, index, isChecked)}
              >
                {item.label}
              </Radio>
            </li>
          );
        })}
      </ul>
    </ButtonDropdown>
  );
}

export default ButtonDropdownRadio;
