import { useEffect, useRef, useState } from "react";

import DateIcon from "@/public/date.svg";
import { convertDateTo_yyyMMdd } from "@/utils/convert";

export default function FilterDate({
  onChange,
  label,
  defaultValue,
  className,
}: {
  onChange?: (date: Date) => void;
  label?: string;
  defaultValue?: Date;
  className?: string;
}) {
  console.log(defaultValue);

  const [date, setDate] = useState<string>(defaultValue ? convertDateTo_yyyMMdd(new Date(defaultValue)) : "");

  useEffect(() => {
    setDate(defaultValue ? convertDateTo_yyyMMdd(new Date(defaultValue)) : "");
  }, [defaultValue]);

  return (
    <div
      className={`flex flex-row flex-wrap relative justify-center items-start p-[3px] border-foreground/50 border rounded-[5]
          text-foreground h-fit w-fit bg-background-items px-2 gap-1 ${className}`}
    >
      <DateIcon className="w-6 h-6 stroke-foreground"></DateIcon>

      <p className="font-bold">{label}</p>
      <input
        className="w-fit"
        type="date"
        value={date}
        onChange={(e) => {
          setDate(e.target.value);
          e.target.value && onChange?.(new Date(e.target.value));
        }}
      ></input>
    </div>
  );
}
