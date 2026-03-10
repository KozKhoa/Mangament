import React from "react";

import ButtonDropdown from "./btn-dropdown";

import SharpTriangleDownIcon from "@/public/sharp-triangle-down.svg";

import Radio from "@/components/inputs/radio";

interface ButtonFilterProps {
  onChange?: (selectedIndex: number) => void;
  label?: string | React.ReactNode;

  selectedIndex: number | null;
  options: string[];

  className?: string;
  name: string;
}

function ButtonDropdownRadio({ onChange, name, label, options, selectedIndex, className }: ButtonFilterProps) {
  function handleChange(index: number | null) {
    if (index === null) return;

    onChange?.(index);
  }

  return (
    <ButtonDropdown
      openOnLeft={true}
      className={`border-foreground/50 border rounded-[5] py-[3px] text-foreground ${className}`}
      acceptButtonLabel="Finish"
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
        {options?.map((op, i) => {
          return (
            <li key={i} className="flex w-full h-fit justify-start items-center">
              <Radio name={name} value={selectedIndex === i} onChange={() => handleChange(i)}>
                {op}
              </Radio>
            </li>
          );
        })}
      </ul>
    </ButtonDropdown>
  );
}

export default ButtonDropdownRadio;
