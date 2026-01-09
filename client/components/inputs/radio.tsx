import React from "react";

import CheckedRadio from "@/public/radio/checked.svg";
import UnCheckedRadio from "@/public/radio/unchecked.svg";

interface RadioProps {
  onChange?: (isOn: boolean) => void;
  name?: string;
  value?: string;
  children?: React.ReactNode;
  className?: string;
  defaultChecked?: boolean;
}

function Radio({ onChange, name, value, children, className, defaultChecked = false }: RadioProps) {
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
        type="radio"
        defaultChecked={defaultChecked}
        name={name}
        value={value}
        onChange={(state) => handleChange(state.target.checked)}
      />

      <CheckedRadio
        className="absolute top-0 left-0 h-[1.5em] w-[1.5em]
          rotate-y-90 peer-checked:rotate-y-0
           transition-all duration-100 ease-linear"
      ></CheckedRadio>

      <UnCheckedRadio
        className="absolute top-0 left-0 peer-checked:rotate-y-90 h-[1.5em] w-[1.5em]
          transition-all duration-100 ease-linear"
      ></UnCheckedRadio>

      {/* This only use for keeping place for the two previous element */}
      <UnCheckedRadio className=" h-[1.5em] w-[1.5em] scale-0"></UnCheckedRadio>

      {children}
    </label>
  );
}

export default Radio;
