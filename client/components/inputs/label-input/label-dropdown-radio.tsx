"use client";

import { useEffect, useState } from "react";

import ButtonDropdown from "@/components/buttons/dropdown/btn-dropdown";

import Radio from "../radio";
import { capitalizeWords } from "@/utils/string";

export default function LabelDropDownRadio({
  label,
  name,
  options,
  defaultSelection,
  onChange,

  className,
}: {
  label?: string;
  name: string;
  options?: string[];
  defaultSelection?: number;

  onChange?: (selectedIndex: number) => void;
  className?: string;
}) {
  const [selected, setSelected] = useState<number>(defaultSelection ?? 0);

  useEffect(() => {
    setSelected(defaultSelection ?? 0);
  }, [defaultSelection]);

  return (
    <div className={`p-2.5 w-full ${className}`}>
      {/* Label */}
      <p className="font-semibold">{label}</p>
      <div className="flex flex-row gap-3 justify-between items-center  w-full border-b px-5 py-0.5">
        <p>{capitalizeWords(options?.at(selected) ?? "")}</p>
        <ButtonDropdown>
          <div className="flex flex-col gap-2">
            {options?.map((op, i) => (
              <Radio
                key={i}
                name={name}
                value={options.at(selected) === op}
                onChange={() => {
                  setSelected(i);
                  onChange?.(i);
                }}
              >
                {capitalizeWords(op)}
              </Radio>
            ))}
          </div>
        </ButtonDropdown>
      </div>
    </div>
  );
}
