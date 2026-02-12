import StoryCard from "@/components/cards/stories/story-card";

import Story from "@/types/story";
import NoContent from "../cards/no-content";
import { useEffect, useRef } from "react";

interface StoryListProps {
  stories?: Story[];

  label?: string;
  onClickLabel?: () => void;
  onScrollToEnd?: () => void;

  className?: string;
}

let isAtTheEnd: boolean = false;

export default function StoryList({ label, onClickLabel, onScrollToEnd, stories, className }: StoryListProps) {
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
        {stories && stories.length > 0 ? (
          <div ref={childRef} className="flex flex-row justify-center gap-2">
            {stories?.map((story, i) => (
              <div key={i} className="w-[150] md:w-[200] ">
                <StoryCard className="h-full" data={story}></StoryCard>
              </div>
            ))}
          </div>
        ) : (
          <NoContent></NoContent>
        )}
      </div>
    </div>
  );
}
