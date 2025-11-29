import FONT from "@/constants/font";
import ButtonDropdownRadio from "../buttons/dropdown/btn-drop-down-radio";

import FontIcon from "@/public/font.svg";

import { useEffect, useRef, useState } from "react";

interface FontSelectionProps {
  onChange?: (fontId: string) => void;
  className?: string;

  defaultValue?: string;
}

export default function FontSelection({ onChange, className, defaultValue }: FontSelectionProps) {
  const [fonts, setFonts] = useState<{ label: string; code: string; isChecked: boolean }[]>([]);
  const [selectedIndex, setSelectedIndex] = useState<number>(0);

  function handelChange(selectedOption: { label: string; code?: string; isChecked: boolean }[]) {
    selectedOption.forEach((op, i) => {
      if (op.isChecked) {
        setSelectedIndex(i);
        return onChange?.(op.code ?? defaultValue ?? "");
      }
    });
  }

  useEffect(() => {
    setFonts(
      FONT.map((f, i) => {
        if (f.id === defaultValue) setSelectedIndex(i);
        return { label: f.name, code: f.id, isChecked: f.id === defaultValue ? true : false };
      })
    );
  }, [defaultValue]);

  return (
    <ButtonDropdownRadio
      className={`${className}`}
      label={
        <div className="flex flex-row flex-wrap gap-1.5 justify-center items-center w-fit h-fit">
          <FontIcon className="w-5 h-5 text-foreground stroke-0"></FontIcon>
          <p className="font-bold">Font chữ:</p>
          <div className="flex flex-row flex-wrap gap-2">
            <p>{fonts.at(selectedIndex)?.label}</p>
          </div>
        </div>
      }
      options={fonts}
      name="font-selection"
      onFinishCheck={handelChange}
    ></ButtonDropdownRadio>
  );
}
