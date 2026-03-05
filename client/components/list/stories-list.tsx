import StoryCard from "@/components/cards/stories/story-card";

import Story from "@/types/story";
import NoContent from "../cards/no-content";
import { useEffect, useRef } from "react";
import InfinityScrollHorizontalList from "./infinity-scroll-horizontal-list";

interface StoryListProps {
  stories?: Story[];

  label?: string;
  onClickLabel?: () => void;
  onScrollToEnd?: () => void;

  className?: string;
}

let isAtTheEnd: boolean = false;

export default function StoryList({ label, onClickLabel, onScrollToEnd, stories, className }: StoryListProps) {
  return (
    <div className={` flex flex-col justify-center items-center gap-5 w-full ${className}`}>
      <h2 onClick={() => onClickLabel?.()} className="text-[2em] font-bold cursor-pointer border-b-2">
        {label}
      </h2>

      <InfinityScrollHorizontalList>
        {stories?.map((story) => (
          <div className="px-1 h-full">
            <StoryCard key={story.id} className="h-full p-2" data={story}></StoryCard>
          </div>
        ))}
      </InfinityScrollHorizontalList>
    </div>
  );
}
