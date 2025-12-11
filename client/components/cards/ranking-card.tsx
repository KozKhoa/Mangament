import Story from "@/types/story";

import StoryCard from "./stories/story-card";

import FirstRankIcon from "@/public/ranking/1.png";
import SecondRankIcon from "@/public/ranking/2.png";
import ThirdRankIcon from "@/public/ranking/3.png";
import { Ref, RefAttributes } from "react";

export default function RankingCard({ top, story, className, ref }: { top?: number; story: Story; className?: string; ref?: Ref<HTMLDivElement> }) {
  function textColorMapping(top: number) {
    if (top === 1) return "text-yellow-500";
    if (top === 2) return "text-gray-500";
    if (top === 3) return "text-orange-800";
    if (top === 4) return "text-orange-600";
    if (top === 5) return "text-green-800";

    return "text-foreground";
  }

  return (
    <div ref={ref} className={`relative ${className}`}>
      {top && (
        <>
          <StoryCard className={`flex-row justify-start shadow-none border-0 hover:shadow-none hover:border-transparent ${className}`} data={story}></StoryCard>
          <div
            className={`absolute right-0 bottom-0 font-aclonica text-8xl
          ${textColorMapping(top)}`}
          >
            {top}
          </div>
        </>
      )}
    </div>
  );
}
