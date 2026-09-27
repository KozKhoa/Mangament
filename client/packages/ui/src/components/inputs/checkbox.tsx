import React, { useState } from "react";

import CheckIcon from "@/public/checkbox/checked.svg";
import UnCheckIcon from "@/public/checkbox/unchecked.svg";
import TickIcon from "@/public/checkbox/tick.svg";

interface CheckBoxProps {
  children?: React.ReactNode | string;
  className?: string;
  onChange?: (checked: boolean) => void;
  name?: string;
  value?: boolean;
  tabIndex?: number;
}

function Checkbox({ children, className, name, value, onChange, tabIndex }: CheckBoxProps) {
  const handleChange = (checked: boolean) => {
    onChange?.(checked);
  };
  return (
    <label
      className={`flex flex-row relative justify-start items-center gap-2 cursor-pointer w-full h-fit 
          text-foreground 
        ${className}`}
    >
      <input
        className={`sr-only peer`}
        type="checkbox"
        checked={value}
        name={name}
        onChange={(state) => handleChange(state.target.checked)}
        tabIndex={tabIndex}
      />

      <CheckIcon
        className={`absolute top-1/2 -translate-y-1/2 left-0 h-[1.5em] w-[1.5em]
          rotate-y-90 peer-checked:rotate-y-0
          transition-all duration-100 ease-linear`}
      ></CheckIcon>

      <UnCheckIcon
        className={`absolute top-1/2 -translate-y-1/2 left-0 peer-checked:rotate-y-90 h-[1.5em] w-[1.5em]
          transition-all duration-100 ease-linear`}
      ></UnCheckIcon>

      {/* This only use for keeping place for the two previous element */}
      <UnCheckIcon className=" h-[1.5em] w-[1.5em] scale-0"></UnCheckIcon>

      {children}
    </label>
  );
}

export default Checkbox;
