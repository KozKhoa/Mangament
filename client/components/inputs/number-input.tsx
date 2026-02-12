import { useEffect, useState } from "react";

import PlusIcon from "@/public/plus.svg";
import MinusIcon from "@/public/minus.svg";

interface NumberInputProps {
  max?: number;
  min?: number;
  defaultValue?: number;

  width?: string;
  height?: string;

  onChange?: (value: number) => void;

  className?: string;
}

export default function NumberInput({ className, min = 0, max = 100, defaultValue = 0, width = "1em", height = "1em", onChange }: NumberInputProps) {
  const [number, setNumber] = useState<number>(defaultValue);

  function handleChange(value: number) {
    if (value < min || value > max) return;

    setNumber(value);
    onChange?.(value);
  }

  useEffect(() => {
    setNumber(defaultValue);
  }, [defaultValue]);

  return (
    <div className={`border rounded-md px-2 w-fit text-center flex justify-between gap-1   ${className}`}>
      <button className=" cursor-pointer " onClick={() => handleChange(number - 1)}>
        <MinusIcon className={`w-[${width}] h-[${height}]`}></MinusIcon>
      </button>
      <input
        value={Math.floor(number)}
        onChange={(e) => handleChange(Number(e.target.value))}
        className="text-[1.2em] text-center outline-none w-10
            [-moz-appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
        type="number"
      ></input>
      <button className=" cursor-pointer " onClick={() => handleChange(number + 1)}>
        <PlusIcon className={`w-[${width}] h-[${height}]`}></PlusIcon>
      </button>
    </div>
  );
}
