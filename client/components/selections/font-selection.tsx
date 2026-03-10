import FONT from "@/constants/font";

import ButtonDropdownRadio from "../buttons/dropdown/btn-drop-down-radio";

import FontIcon from "@/public/font.svg";

import { useEffect, useState } from "react";

interface FontSelectionProps {
  onChange?: (fontId: string) => void;
  className?: string;

  value: string;
}

const FONT_NAME = FONT.map((font) => font.name);

export default function FontSelection({ onChange, className, value }: FontSelectionProps) {
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);

  useEffect(() => {
    const find = FONT.findIndex((font) => font.id === value);
    setSelectedIndex(find < 0 ? null : find);
  }, [value]);

  return (
    <ButtonDropdownRadio
      className={`${className}`}
      label={
        <div className="flex flex-row flex-wrap gap-1.5 justify-center items-center w-fit h-fit">
          <FontIcon className="w-5 h-5 text-foreground stroke-0"></FontIcon>
          <p className="font-bold">Font chữ:</p>
          <div className="flex flex-row flex-wrap gap-2">
            <p>{selectedIndex !== null ? FONT[selectedIndex]?.name : ""}</p>
          </div>
        </div>
      }
      options={FONT_NAME}
      name="font-selection"
      selectedIndex={selectedIndex}
      onChange={(index) => onChange?.(FONT[index].id)}
    ></ButtonDropdownRadio>
  );
}
