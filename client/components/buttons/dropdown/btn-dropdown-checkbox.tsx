import React, { useRef, useState } from "react";

import ButtonDropdown from "./btn-dropdown";
import SharpTriangleDownIcon from "@/public/sharp-triangle-down.svg";
import Checkbox from "@/components/inputs/checkbox";

interface ButtonFilterOption {
  label: string;
  isChecked: boolean;
  [key: string]: any;
}

interface ButtonFilterProps {
  onFinishCheck?: (selectedOption: ButtonFilterOption[]) => void;
  label?: string | React.ReactNode;
  options: ButtonFilterOption[];
  className?: string;
  name?: string;
}

function ButtonDropdownCheckbox({ onFinishCheck, label, options, className, name }: ButtonFilterProps) {
  const [rerender, setRerender] = useState(false); // This only use to force this component re render to update items

  const handleUpdateSelected = (item: ButtonFilterOption, index: number, isChecked: boolean) => {
    if (options && options[index]) {
      options[index].isChecked = isChecked;
    }
  };

  const resetAllField = () => {
    options?.forEach((item) => {
      item.isChecked = false;
    });
    handleFinish();
  };

  const handleFinish = () => {
    setRerender(!rerender);
    options && onFinishCheck?.(options);
  };

  return (
    <ButtonDropdown
      openOnLeft={true}
      className={`border-foreground border rounded-[5] relative
          text-foreground ${className}`}
      acceptButtonLabel="Finish"
      onClickAcceptButton={handleFinish}
      closeButtonLabel="Reset"
      onClickCloseButton={resetAllField}
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
        {options?.map((option, index) => {
          return (
            <li key={index} className="flex w-full h-fit justify-start items-center">
              <Checkbox
                defaultChecked={option.isChecked}
                name={name}
                value={option.label}
                onChange={(isChecked) => handleUpdateSelected(option, index, isChecked)}
              >
                {option.label}
              </Checkbox>
            </li>
          );
        })}
      </ul>
    </ButtonDropdown>
  );
}

export default ButtonDropdownCheckbox;
