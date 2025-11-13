import LeftArrowIcon from "@/public/arrows/left-v.svg";
import RightArrowIcon from "@/public/arrows/right-v.svg";
import { useState } from "react";

interface SwitchPageProps {
  defaultPage?: number;
  maxPage: number;
  onChange?: (pageIndex: number) => void;
}

export default function SwitchPage({
  defaultPage,
  maxPage,
  onChange,
}: SwitchPageProps) {
  const buttonClassName =
    "p-1.5 border rounded-[5] border-transparent hover:border-black cursor-pointer";
  const [page, setPage] = useState<number>(defaultPage ?? 0);

  const handleIncrease = () => {
    console.log("sdfasdf");
    page < maxPage &&
      setPage((prev) => {
        onChange?.(prev + 1);
        return prev + 1;
      });
  };
  const handleDecrease = () => {
    page < 0 &&
      setPage((prev) => {
        onChange?.(prev - 1);
        return prev - 1;
      });
  };

  return (
    <div className="flex flex-row gap-3 font-afacad font-bold justify-center items-center w-fit">
      <button className={buttonClassName} onClick={() => handleDecrease()}>
        <LeftArrowIcon className="w-5 h-5 "></LeftArrowIcon>
      </button>
      <p className="text-[1.5em] w-fit">{page}</p>
      <button className={buttonClassName} onClick={() => handleIncrease()}>
        <RightArrowIcon className="w-5 h-5 "></RightArrowIcon>
      </button>
    </div>
  );
}
