import History from "@/types/history";
import HistoryCard from "../cards/history-card";

import NoContent from "../cards/no-content";
import { useRouter } from "next/navigation";
import { useEffect, useRef } from "react";

interface StoryListProps {
  histories?: History[];

  label?: string;
  onClickLabel?: () => void;
  onScrollToEnd?: () => void;
  onRemoveElement?: (history: History) => void;

  className?: string;
}

let isAtTheEnd: boolean = false;

export default function HistoryList({ label = "Lịch sử đọc", onClickLabel, onScrollToEnd, onRemoveElement, histories, className }: StoryListProps) {
  const router = useRouter();

  const containerRef = useRef<HTMLDivElement>(null);
  const childRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleScroll() {
      const childWith = childRef.current?.clientWidth ?? 0;
      const containerWidth = containerRef.current?.clientWidth ?? 0;
      const containerScrollLeft = containerRef?.current?.scrollLeft ?? 0;

      const scrollPosition = containerScrollLeft + containerWidth;

      if (childWith < containerWidth) return;

      if (scrollPosition >= (childWith ?? Infinity) - 100) {
        if (!isAtTheEnd) {
          onScrollToEnd?.();
          isAtTheEnd = true;
        }
      } else {
        isAtTheEnd = false;
      }
    }

    containerRef.current?.addEventListener("scroll", handleScroll);

    return () => containerRef.current?.removeEventListener("scroll", handleScroll);
  }, []);
  return (
    <div className={` flex flex-col justify-center items-center gap-5 w-full ${className}`}>
      <h2 onClick={() => onClickLabel?.()} className="text-[2em] font-bold cursor-pointer border-b-2">
        {label}
      </h2>

      <div ref={containerRef} className="flex flex-row overflow-x-auto w-full p-2">
        {histories && histories.length > 0 ? (
          <div ref={childRef} className="flex flex-row justify-center items-start gap-2">
            {histories?.map((history, i) => (
              <div key={i} className="w-[150] md:w-[200] ">
                <HistoryCard className="w-full" history={history} onClickRemove={() => onRemoveElement?.(history)}></HistoryCard>
              </div>
            ))}
          </div>
        ) : (
          <NoContent buttonLabel="Chuyển đến trang chủ" header2="Đọc thêm truyện để lưu vào lịch sử" onClickButton={() => router.push("/")}></NoContent>
        )}
      </div>
    </div>
  );
}
