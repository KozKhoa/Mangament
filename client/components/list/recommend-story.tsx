import Story from "@/types/story";
import User from "@/types/user";
import StoryList from "./stories-list";
import storyService from "@/services/story";
import { StoryParams } from "@/types/params";
import { toast } from "sonner";
import { useEffect, useState } from "react";

import InfinityScrollHorizontalList from "./infinity-scroll-horizontal-list";
import StoryCard from "../cards/stories/story-card";

export default function RecommendStories({ user, story, className }: { user?: User; story?: Story; className?: string }) {
  const [recommend, setRecommend] = useState<Story[]>([]);

  async function fetchRecommendStory() {
    const params: StoryParams = {
      page: 1,
      limit: 20,
    };
    const res = await storyService.get(params);

    if (!res) return toast.warning("Cannot connect with server");
    if (!res.success) toast.warning(res.message);

    setRecommend(res.data);
  }

  useEffect(() => {
    fetchRecommendStory();
  }, []);

  return (
    <InfinityScrollHorizontalList label="Gợi ý cho bạn">
      {recommend.map((story, i) => (
        <StoryCard key={story.id} data={story}></StoryCard>
      ))}
    </InfinityScrollHorizontalList>
  );
}
