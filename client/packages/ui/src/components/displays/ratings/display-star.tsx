import StarIcon from "@/public/star.svg";
import { useRef } from "react";

interface DisplayStar {
  rating: number;
  width?: string;
  height?: string;
  className?: string;
}

export default function DisplayStar({ rating, width = "1em", height = "1em", className }: DisplayStar) {
  const arr = useRef(Array.from({ length: 5 }));
  const star = useRef<number>(Math.trunc(rating));

  return (
    <div
      className={`flex flex-row gap-1 justify-center items-center
    
        ${className}
    `}
    >
      {arr.current.map((_, i) =>
        i < star.current ? (
          // Yellow star
          <StarIcon key={i} className={`w-[${width}] h-[${height}] fill-amber-400`}></StarIcon>
        ) : i === star.current ? (
          // Mix yellow and gray star
          <div key={i} className="relative w-fit h-fit">
            <StarIcon className={`w-[${width}] h-[${height}] fill-gray-400`}></StarIcon>
            <div
              className={` absolute overflow-hidden top-0 left-0 `}
              style={{
                width: (rating - star.current) * 100 + "%",
              }}
            >
              <StarIcon className={`w-[${width}] h-[${height}] fill-amber-400`}></StarIcon>
            </div>
          </div>
        ) : (
          // Gray star
          <StarIcon key={i} className={`w-[${width}] h-[${height}] fill-gray-400`}></StarIcon>
        ),
      )}
    </div>
  );
}
