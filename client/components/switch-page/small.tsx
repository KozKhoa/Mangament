import LeftArrowIcon from "@/public/arrows/left-v.svg";
import RightArrowIcon from "@/public/arrows/right-v.svg";
import { useEffect, useState } from "react";

interface SwitchPageProps {
  defaultPage?: number;
  maxPage: number;
  page: number;
  onChange?: (pageIndex: number) => void;

  className?: string;
}

export default function SwitchPageSmall({ defaultPage, maxPage, page, onChange, className }: SwitchPageProps) {
  const [pageNumber, setPageNumber] = useState<string>("");

  const buttonClassName = `p-1.5 border rounded-[5] border-transparent`;

  const handleChange = (pageIndex: number) => {
    if (pageIndex < 1 || pageIndex > maxPage) return;

    setPageNumber(pageIndex.toString());
    onChange?.(pageIndex);
  };

  useEffect(() => {
    setPageNumber(page.toString());
  }, [page]);

  return (
    <div className={`flex flex-row gap-3   font-bold justify-center items-center w-fit  ${className}`}>
      <button
        className={`${buttonClassName} ${page === 1 ? "text-gray-300" : "text-foreground hover:border-black cursor-pointer "}`}
        onClick={() => handleChange(page - 1)}
      >
        <LeftArrowIcon className={`w-5 h-5 `}></LeftArrowIcon>
      </button>
      <label className="w-fit">
        <input
          value={pageNumber}
          alt="Nhập số trang"
          type="number"
          onChange={(e) => {
            if (/^\d*$/.test(e.target.value)) {
              // Only accept integer > 0
              setPageNumber(e.target.value);
            }
          }}
          // Remove arrow increase or descrease number in input box
          className="text-[1.5em] w-20 text-center outline-none
            [-moz-appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
          onKeyDown={(e) => e.key === "Enter" && handleChange(Number(pageNumber))}
        ></input>
      </label>
      <button
        className={` ${buttonClassName} ${page >= maxPage ? "text-gray-300" : "text-foreground hover:border-black cursor-pointer "}`}
        onClick={() => handleChange(page + 1)}
      >
        <RightArrowIcon className={`w-5 h-5 $`}></RightArrowIcon>
      </button>
    </div>
  );
}
