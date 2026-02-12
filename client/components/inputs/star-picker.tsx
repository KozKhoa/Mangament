import StarIcon from "@/public/star.svg";
import { useRef, useState } from "react";

interface StarPickerProps {
  onChange?: (star: number) => void;
  defaultValue?: number;
  maxStar?: number;

  width?: string;
  height?: string;

  className?: string;
}

export default function StarPicker({ onChange, defaultValue, maxStar, width = "1.5em", height = "1.5em", className }: StarPickerProps) {
  const [rating, setRating] = useState<number>(defaultValue ?? 0);

  function handleChosen(index: number) {
    setRating(index);
    onChange?.(index + 1);
  }

  const arr = useRef(Array.from({ length: maxStar ?? 5 }));
  return (
    <div className={`flex flex-row gap-1 justify-center items-center ${className}`}>
      {arr.current.map((_, i) => (
        <button key={i} onClick={() => handleChosen(i)}>
          {i <= rating ? (
            <StarIcon className={`w-[${width}] h-[${height}] fill-amber-400`}></StarIcon>
          ) : (
            <StarIcon className={`w-[${width}] h-[${height}] fill-gray-400`}></StarIcon>
          )}
        </button>
      ))}
    </div>
  );
}
