import Story from "@/types/story";

import StoryCard from "./stories/story-card";

import { Ref } from "react";

export default function RankingVerticalCard({ top, story, className, ref }: { top?: number; story: Story; className?: string; ref?: Ref<HTMLDivElement> }) {
  function textColorMapping(top: number) {
    if (top === 1) return "text-yellow-500";
    if (top === 2) return "text-gray-500";
    if (top === 3) return "text-amber-700";
    if (top === 4) return "text-blue-800";
    if (top === 5) return "text-green-700";
    if (top === 6) return "text-teal-600";
    if (top === 7) return "text-violet-700";
    if (top === 8) return "text-orange-600";
    if (top === 9) return "text-red-600";
    if (top === 10) return "text-foreground";

    return "text-foreground";
  }

  return (
    <div ref={ref} className={`relative ${className}`}>
      {top && (
        <>
          <StoryCard className="h-full w-full" data={story}></StoryCard>
          <div
            className={`absolute top-1.5 left-1.5 rounded-l-md px-2 py-1 font-aclonica text-[20px] md:text-[22px] lg:text-[28px] 
              bg-background-items rounded-b-full shadow-md
          ${textColorMapping(top)}`}
          >
            {top}
          </div>
        </>
      )}
    </div>
  );
}
