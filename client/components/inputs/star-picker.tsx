import StarIcon from "@/public/star.svg";
import { useRef, useState } from "react";

interface StarPickerProps {
  onChange?: (star: number) => void;
  defaultValue?: number;
  maxStar?: number;
}

export default function StarPicker({ onChange, defaultValue, maxStar }: StarPickerProps) {
  const [rating, setRating] = useState<number>(defaultValue ?? 0);

  function handleChosen(index: number) {
    setRating(index);
    onChange?.(index + 1);
  }

  const arr = useRef(Array.from({ length: maxStar ?? 5 }));
  return (
    <div className="flex flex-row gap-1 justify-center items-center">
      {arr.current.map((_, i) => (
        <button key={i} onClick={() => handleChosen(i)}>
          {i <= rating ? (
            <StarIcon className="w-[1.8em] h-[1.8em] fill-amber-400"></StarIcon>
          ) : (
            <StarIcon className="w-[1.8em] h-[1.8em] fill-gray-400"></StarIcon>
          )}
        </button>
      ))}
    </div>
  );
}
