import { useEffect, useRef, useState } from "react";

import RightArrowUnderlineIcon from "@/public/arrows/right-underline.svg";
import LeftArrowIcon from "@/public/arrows/left-v.svg";
import RightArrowIcon from "@/public/arrows/right-v.svg";

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
  const arr = useRef(Array.from({ length: maxPage < 20 ? maxPage : 20 }));
  const [pageNumber, setPageNumber] = useState<number>(0);

  const [page, setPage] = useState<number>(defaultPage ?? 1);

  const arrowClassName =
    "p-1.5 border rounded-[5] border-transparent hover:border-black cursor-pointer";

  const handleChange = (pageIndex: number) => {
    if (pageIndex <= 0 || pageIndex > maxPage || pageIndex === page) return;
    setPageNumber(0);
    onChange?.(pageIndex);
    setPage(pageIndex);
  };

  return (
    <div className="flex flex-row gap-2.5 w-fit font-afacad text-[1.2em]">
      <button className={arrowClassName} onClick={() => handleChange(page - 1)}>
        <LeftArrowIcon className="w-6 h-6"></LeftArrowIcon>
      </button>
      <div className="flex flex-row flex-wrap sm:grid grid-cols-5 sm:grid-cols-10 md:grid-cols-12 lg:grid-cols-20 gap-1">
        {maxPage <= 20 ? (
          arr.current.map((_, i) => (
            <button
              key={i}
              onClick={() => handleChange(i + 1)}
              className={`p-1.5 min-w-10 h-10 border rounded-[5] border-transparent hover:border-black cursor-pointer
                
                ${i + 1 === page ? "bg-gray-200" : "bg-background"}
                `}
            >
              {i + 1}
            </button>
          ))
        ) : (
          <>
            {Array.from({ length: 5 }).map((_, i) => (
              <button
                key={i}
                onClick={() => handleChange(i + 1)}
                className={`p-1.5 min-w-10 h-10 border rounded-[5] border-transparent hover:border-black cursor-pointer
                    flex justify-center items-center
                    ${i + 1 === page ? "bg-gray-200" : "bg-background"}
                `}
              >
                {i + 1}
              </button>
            ))}

            <div
              className={`p-1.5 min-w-10 h-10 border rounded-[5] border-transparent
                flex justify-center items-center font-bold`}
            >
              ...
            </div>

            {Array.from({ length: 5 }).map((_, i) => (
              <button
                key={
                  page <= 7
                    ? i + 5 + 1
                    : page >= maxPage - 6
                    ? maxPage - 9 + i
                    : page - 2 + i
                }
                onClick={() =>
                  handleChange(
                    page <= 7
                      ? i + 5 + 1
                      : page >= maxPage - 6
                      ? maxPage - 9 + i
                      : page - 2 + i
                  )
                }
                className={`p-1.5 min-w-10 h-10 border rounded-[5] border-transparent hover:border-black cursor-pointer
                    flex justify-center items-center
                    ${
                      (page <= 7
                        ? i + 5 + 1
                        : page >= maxPage - 6
                        ? maxPage - 9 + i
                        : page - 2 + i) === page
                        ? "bg-gray-200"
                        : "bg-background"
                    }
                `}
              >
                {page <= 7
                  ? i + 5 + 1
                  : page >= maxPage - 6
                  ? maxPage - 9 + i
                  : page - 2 + i}
              </button>
            ))}

            <label
              className="col-span-3 flex justify-center items-center w-30 h-10 p-0.5
                border border-black rounded-[5]"
            >
              <input
                type="number"
                step={1}
                value={pageNumber || ""}
                placeholder="Nhập số trang"
                alt="Nhập số trang"
                className="outline-none font-afacad w-full p-1 text-center"
                onChange={(e) => {
                  if (/^\d*$/.test(e.target.value))
                    // Only accept integer > 0
                    setPageNumber(Number(e.target.value));
                }}
                onKeyDown={(e) => e.key === "Enter" && handleChange(pageNumber)}
              ></input>

              <button
                className="cursor-pointer w-fit h-full"
                onClick={() => handleChange(pageNumber)}
              >
                <RightArrowUnderlineIcon className="w-5 h-5"></RightArrowUnderlineIcon>
              </button>
            </label>

            <div
              className={`p-1.5 min-w-10 h-10 border rounded-[5] border-transparent
                flex justify-center items-center font-bold`}
            >
              ...
            </div>
            {Array.from({ length: 5 }).map((_, i) => (
              <button
                key={maxPage - 4 + i}
                onClick={() => handleChange(maxPage - 4 + i)}
                className={`p-1.5 min-w-10 h-10 border rounded-[5] border-transparent hover:border-black cursor-pointer
                    flex justify-center items-center
                    ${
                      maxPage - 4 + i === page ? "bg-gray-200" : "bg-background"
                    }
                `}
              >
                {maxPage - 4 + i}
              </button>
            ))}
          </>
        )}
      </div>
      <button className={arrowClassName} onClick={() => handleChange(page + 1)}>
        <RightArrowIcon className="w-6 h-6"></RightArrowIcon>
      </button>
    </div>
  );
}
