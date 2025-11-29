import Story from "@/types/story";
import User from "@/types/user";
import StoryList from "./stories-list";
import storyService from "@/services/story";
import { StoryParams } from "@/types/params";
import { toast } from "sonner";
import { useEffect, useState } from "react";

export default function RecommendStories({ user, story, className }: { user?: User; story?: Story; className?: string }) {
  const [recommend, setRecommend] = useState<Story[]>([]);

  async function fetchRecommendStory() {
    const params: StoryParams = {
      page: 1,
      limit: 20,
    };
    const res = await storyService.get(params);

    if (!res) return toast.warning("Server Error");
    if (!res.success) toast.warning(res.message);

    setRecommend(res.data);
  }

  useEffect(() => {
    fetchRecommendStory();
  }, []);

  return <StoryList className={className} label="Gợi ý cho bạn" stories={recommend}></StoryList>;
}
