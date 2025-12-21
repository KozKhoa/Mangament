import { useEffect, useRef, useState } from "react";

import DateIcon from "@/public/date.svg";

export default function FilterDate({ onFilter, isReset = false, className }: { onFilter?: ({}) => void; isReset: boolean; className?: string }) {
  const isRunFirstTime = useRef(true);
  const [fromDate, setFromDate] = useState<string>("");
  const [toDate, setToDate] = useState<string>("");

  useEffect(() => {
    if (isReset) {
      setFromDate("");
      setToDate("");
    }
  }, [isReset]);

  return (
    <>
      <div
        className={`flex flex-row flex-wrap relative justify-center items-start p-[1] border-foreground border rounded-[5]
          text-foreground h-fit w-fit bg-background px-2 gap-1 ${className}`}
      >
        <DateIcon className="w-6 h-6"></DateIcon>

        <p className="font-bold">Từ ngày:</p>
        <input
          className="w-fit"
          type="date"
          value={fromDate}
          onChange={(e) => {
            setFromDate(e.target.value);
            onFilter?.({ fromDate: e.target.value });
          }}
        ></input>
      </div>

      <div
        className={`flex flex-row flex-wrap relative justify-center items-start p-[1] border-foreground border rounded-[5]
          text-foreground h-fit w-fit bg-background px-2 gap-1 ${className}`}
      >
        <DateIcon className="w-6 h-6"></DateIcon>

        <p className="font-bold">Đến ngày:</p>
        <input
          className="w-fit"
          type="date"
          value={toDate}
          onChange={(e) => {
            setToDate(e.target.value);
            onFilter?.({ toDate: e.target.value });
          }}
        ></input>
      </div>
    </>
  );
}
