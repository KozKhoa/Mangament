import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";

import storyService from "@/services/story";
import Story from "@/types/story";

import RankingCard from "../cards/ranking-card";

import InfinityScrollHorizontalList from "./infinity-scroll-horizontal-list";

export default function StoriesRankingList({ rankBy = "view", label, className }: { rankBy?: string; label?: string; className?: string }) {
  const [stories, setStories] = useState<Story[]>([]);

  async function fetchStories() {
    const res = await storyService.getStories({ page: 1, limit: 5, sort: `${rankBy}:desc` });

    if (!res) return toast.warning("Cannot connect with server");
    if (!res.success) return toast.warning(res.message);

    setStories(res.data ?? []);
  }

  useEffect(() => {
    fetchStories();
  }, []);

  return (
    <div className={`px-2 py-1 border-2 rounded-md w-full shadow-[5px_8px_4px_rgba(0,0,0,0.3)] bg-background-items ${className}`}>
      <InfinityScrollHorizontalList
        label={label}
        autoSlide={4000}
        isLoading={stories.length <= 0}
        numberOfElementInScreen={{ basic: 1, sm: 2, md: 2, lg: 3, xl: 3 }}
      >
        {stories?.map((story, i) => (
          <div key={story.id}>
            <RankingCard story={story} top={i + 1}></RankingCard>
          </div>
        ))}
      </InfinityScrollHorizontalList>
    </div>
  );
}
