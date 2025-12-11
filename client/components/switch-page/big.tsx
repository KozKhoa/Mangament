import { useEffect, useRef, useState } from "react";

import RightArrowUnderlineIcon from "@/public/arrows/right-underline.svg";
import LeftArrowIcon from "@/public/arrows/left-v.svg";
import RightArrowIcon from "@/public/arrows/right-v.svg";

interface SwitchPageProps {
  page: number;
  maxPage: number;
  onChange?: (pageIndex: number) => void;
  className?: string;
}

export default function SwitchPageBig({ page, maxPage, onChange, className }: SwitchPageProps) {
  if (!maxPage || isNaN(maxPage)) maxPage = 0;

  const [arr20, setArr20] = useState(Array.from({ length: maxPage }));

  const arr5 = useRef(Array.from({ length: 5 }));

  const [pageNumber, setPageNumber] = useState<number>(0);

  const arrowClassName = "p-1.5 border rounded-md border-transparent";

  const handleChange = (pageIndex: number) => {
    if (pageIndex < 1 || pageIndex > maxPage || pageIndex === page) return;
    setPageNumber(0);
    onChange?.(pageIndex);
  };

  useEffect(() => {
    setArr20(Array.from({ length: maxPage }));
  }, [maxPage]);

  const getPageNumber = (i: number) => {
    if (page <= 7) return i + 6;
    if (page >= maxPage - 6) return maxPage - 9 + i;
    return page - 2 + i;
  };

  return (
    <div className={`flex flex-row gap-2.5 w-fit   text-[1.2em] text-foreground  ${className}`}>
      {/* Left arrow button */}
      <button
        className={`${arrowClassName} ${page <= 1 ? "text-gray-300" : "text-foreground hover:border-black cursor-pointer"}`}
        onClick={() => handleChange(page - 1)}
      >
        <LeftArrowIcon className={`w-6 h-6 ${page <= 1 ? "text-gray-300" : "text-foreground"}`}></LeftArrowIcon>
      </button>

      {/* Button choose page index */}
      <div className="flex flex-row flex-wrap  gap-1">
        {maxPage <= 20 ? (
          arr20.map((_, i) => (
            <button
              key={i + 1}
              onClick={() => handleChange(i + 1)}
              className={`p-1.5 min-w-10 h-10 border rounded-md border-transparent hover:border-black cursor-pointer
                text-black 
                ${i + 1 === page ? "bg-gray-200" : "bg-background"}
                `}
            >
              {i + 1}
            </button>
          ))
        ) : (
          <>
            {arr5.current.map((_, i) => (
              <button
                key={i}
                onClick={() => handleChange(i + 1)}
                className={`p-1.5 min-w-10 h-10 border rounded-md border-transparent hover:border-black cursor-pointer
                    flex justify-center items-center text-black 
                    ${i + 1 === page ? "bg-gray-200" : "bg-background"}
                `}
              >
                {i + 1}
              </button>
            ))}

            <div
              className={`p-1.5 min-w-10 h-10 border rounded-md border-transparent text-black 
                flex justify-center items-center font-bold`}
            >
              ...
            </div>

            {arr5.current.map((_, i) => (
              <button
                key={i}
                onClick={() => handleChange(getPageNumber(i))}
                className={`p-1.5 min-w-10 h-10 border rounded-md border-transparent hover:border-black cursor-pointer
                    flex justify-center items-center text-black 
                    ${getPageNumber(i) === page ? "bg-gray-200" : "bg-background"}
                `}
              >
                {getPageNumber(i)}
              </button>
            ))}

            <label
              className="col-span-3 flex justify-center items-center w-30 h-10 p-0.5
                border border-black rounded-md"
            >
              <input
                type="number"
                step={1}
                value={pageNumber || ""}
                placeholder="Nhập số trang"
                alt="Nhập số trang"
                className="text-center w-full outline-none 
                  [-moz-appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none 
                  [&::-webkit-inner-spin-button]:appearance-none"
                onChange={(e) => {
                  if (/^\d*$/.test(e.target.value))
                    // Only accept integer > 0
                    setPageNumber(Number(e.target.value));
                }}
                onKeyDown={(e) => e.key === "Enter" && handleChange(pageNumber)}
              ></input>

              <button
                className={`${arrowClassName} ${page === maxPage ? "text-gray-300" : "text-foreground hover:border-black"}`}
                onClick={() => handleChange(pageNumber)}
              >
                <RightArrowUnderlineIcon className="w-5 h-5"></RightArrowUnderlineIcon>
              </button>
            </label>

            <div
              className={`p-1.5 min-w-10 h-10 border rounded-md border-transparent text-black 
                flex justify-center items-center font-bold`}
            >
              ...
            </div>
            {arr5.current.map((_, i) => (
              <button
                key={maxPage - 4 + i}
                onClick={() => handleChange(maxPage - 4 + i)}
                className={`p-1.5 min-w-10 h-10 border rounded-md border-transparent hover:border-black cursor-pointer
                    flex justify-center items-center text-black 
                    ${maxPage - 4 + i === page ? "bg-gray-200" : "bg-background"}
                `}
              >
                {maxPage - 4 + i}
              </button>
            ))}
          </>
        )}
      </div>

      {/* Right arrow button */}
      <button className={`${arrowClassName} ${page >= maxPage ? "text-gray-300" : "text-foreground"}`} onClick={() => handleChange(page + 1)}>
        <RightArrowIcon className={`w-6 h-6 ${page >= maxPage ? "text-gray-300" : "text-foreground"}`}></RightArrowIcon>
      </button>
    </div>
  );
}
