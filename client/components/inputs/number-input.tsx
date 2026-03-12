import { useEffect, useRef, useState } from "react";

import PlusIcon from "@/public/plus.svg";
import MinusIcon from "@/public/minus.svg";

interface NumberInputProps {
  max?: number;
  min?: number;
  defaultValue?: number;
  value?: number;

  delay?: number;

  width?: string;
  height?: string;

  onChange?: (value: number) => void;

  allowNegative?: boolean;
  allowPositive?: boolean;
  allowNumeric?: boolean;

  className?: string;
}

export default function NumberInput({
  className,
  min = -Infinity,
  max = Infinity,
  defaultValue = 0,
  value,
  delay = 500,
  allowNegative = true,
  allowPositive = true,
  allowNumeric = true,
  width = "1em",
  height = "1em",
  onChange,
}: NumberInputProps) {
  const [firstRun, setFirstRun] = useState(true);

  const [number, setNumber] = useState<string>(value?.toString() ?? defaultValue.toString());

  function handleChange(value: string) {
    if (Number(value) < min || Number(value) > max) return;

    if (!value) {
      setNumber("");
    }

    if ((value === "-" && allowNegative) || (value === "+" && allowPositive)) {
      setNumber(value.toString());
    }

    if (/^[-+]?\d+(\.\d*)?$/.test(value)) {
      if (!allowNumeric && !/^[-+]?\d+$/.test(value)) return; // If not allow numeric
      if (!allowNegative && Number(value) < 0) return; // If not allow negative number
      if (!allowPositive && Number(value) > 0) return; // If not allow positive number

      setNumber(value.toString());
    }
  }

  useEffect(() => {
    if (firstRun) {
      setFirstRun(false);
      return;
    }

    if (value === undefined) return;
    setNumber(value?.toString());
  }, [value]);

  useEffect(() => {
    if (firstRun) {
      setFirstRun(false);
      return;
    }

    const timer = setTimeout(() => {
      onChange?.(Number(number));
    }, delay);

    return () => clearTimeout(timer);
  }, [number]);

  return (
    <div className={`border rounded-md px-2 w-fit text-center flex justify-between gap-1   ${className}`}>
      <button className=" cursor-pointer " onClick={() => handleChange((Number(number) - 1).toString())}>
        <MinusIcon className={`w-[${width}] h-[${height}]`}></MinusIcon>
      </button>
      <input
        value={number}
        onChange={(e) => {
          const value = e.target.value;

          if (!value) return handleChange("");
          if ((value === "-" && allowNegative) || (value === "+" && allowPositive)) return handleChange(value);

          if (/^[-+]?\d+(\.\d*)?$/.test(value)) {
            if (!allowNumeric && !/^[-+]?\d+$/.test(value)) return; // If not allow numeric
            if (!allowNegative && Number(value) < 0) return; // If not allow negative number
            if (!allowPositive && Number(value) > 0) return; // If not allow positive number

            handleChange(value);
          }
        }}
        inputMode="numeric"
        className="text-[1.2em] text-center outline-none 
            [-moz-appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
        type="text"
        style={{ width: number.toString().length * 10 + 20 + "px" }}
      ></input>
      <button className=" cursor-pointer " onClick={() => handleChange((Number(number) + 1).toString())}>
        <PlusIcon className={`w-[${width}] h-[${height}]`}></PlusIcon>
      </button>
    </div>
  );
}
