import { toast } from "sonner";
import { useEffect, useState } from "react";

import Story from "@/types/story";

import storyService from "@/services/story";

import InfinityScrollHorizontalList from "./infinity-scroll-horizontal-list";
import StoryCard from "../cards/stories/story-card";
import Loading from "../loadings/loading";

const LIMIT = 20;

export default function RecommendStories({ story, className }: { story: Story; className?: string }) {
  const [recommend, setRecommend] = useState<Story[]>([]);
  const [loading, setLoading] = useState(false);

  async function fetchRecommendStory() {
    setLoading(true);
    const res = await storyService.getRecommendStories(story?.id ?? "", 1, LIMIT);
    setLoading(false);

    if (!res.success) toast.warning(res.message);

    setRecommend(res.data ?? []);
  }

  useEffect(() => {
    fetchRecommendStory();
  }, []);

  return (
    <InfinityScrollHorizontalList label="Gợi ý cho bạn" isLoading={loading} className={className}>
      {recommend.map((story, i) => (
        <div className="p-1 h-full">
          <StoryCard className="bg-background-items" key={story.id} data={story}></StoryCard>
        </div>
      ))}
    </InfinityScrollHorizontalList>
  );
}
