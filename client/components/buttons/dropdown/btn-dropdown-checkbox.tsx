import React, { useRef, useState } from "react";

import ButtonDropdown from "./btn-dropdown";
import SharpTriangleDownIcon from "@/public/sharp-triangle-down.svg";
import Checkbox from "@/components/inputs/checkbox";

interface ButtonFilterOption {
  label: string;
  checked: boolean;
}

interface ButtonFilterProps {
  onFinishCheck?: (selectedOption: ButtonFilterOption[]) => void;
  label?: string | React.ReactNode;
  options?: ButtonFilterOption[];
  className?: string;
  name?: string;
}

function ButtonDropdownCheckbox({
  onFinishCheck,
  label,
  options,
  className,
  name,
}: ButtonFilterProps) {
  const items = useRef(options);
  const [rerender, setRerender] = useState(false); // This only use to force this component re render to update items

  const handleUpdateSelected = (
    item: ButtonFilterOption,
    index: number,
    checked: boolean
  ) => {
    if (items.current && items.current[index]) {
      items.current[index].checked = checked;
    }
  };

  const handleFinish = () => {
    setRerender(!rerender);
    items.current && onFinishCheck?.(items.current);
  };

  return (
    <ButtonDropdown
      openOnLeft={true}
      className={`border-foreground border rounded-[5] 
        text-size-default text-foreground ${className}`}
      showCloseButton={true}
      closeButtonLabel="Finish"
      onClickCloseButton={handleFinish}
      icon={
        <div
          className={`flex flex-row relative justify-start items-center gap-1.5 cursor-pointer w-fit
        font-afacad text-foreground bg-background px-2 
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
        {items.current?.map((item, index) => {
          return (
            <li
              key={index}
              className="flex w-full h-fit justify-start items-center"
            >
              <Checkbox
                defaultChecked={item.checked}
                name={name}
                value={item.label}
                onChange={(checked) =>
                  handleUpdateSelected(item, index, checked)
                }
              >
                {item.label}
              </Checkbox>
            </li>
          );
        })}
      </ul>
    </ButtonDropdown>
  );
}

export default ButtonDropdownCheckbox;
