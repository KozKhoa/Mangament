import Story from "@/types/story";

import StoryCard from "./stories/story-card";

import { Ref } from "react";

export default function RankingCard({ top, story, className, ref }: { top?: number; story: Story; className?: string; ref?: Ref<HTMLDivElement> }) {
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
    <div ref={ref} className={`relative `}>
      {top && (
        <>
          <StoryCard className={`flex-row justify-start shadow-none border-0 hover:shadow-none hover:border-transparent ${className}`} data={story}></StoryCard>
          <div
            className={`absolute right-2 bottom-0 font-aclonica text-8xl
          ${textColorMapping(top)}`}
          >
            {top}
          </div>
        </>
      )}
    </div>
  );
}
