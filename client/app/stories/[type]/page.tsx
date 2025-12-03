"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";

import { snakeCaseToCapitalizeWord } from "@/utils/string";

import Story from "@/types/story";

import storyService from "@/services/story";

import StoryGrid from "@/components/grids/story-grid";
import RecommendStories from "@/components/list/recommend-story";
import { toast } from "sonner";

export default function StoriesPage() {
  const params = useParams();
  const rawType = params?.type;
  const typeParam = Array.isArray(rawType) ? rawType[0] : rawType ?? "";

  const [recommendedStories, setRecommendedStories] = useState<Story[]>();

  useEffect(() => {
    const getRecommendStory = async () => {
      const res = await storyService.get({ limit: 10 });

      if (!res) return toast.warning("Cannot connect with server");
      if (!res.success) return toast.warning(res.message);

      const stories = res.data;

      setRecommendedStories(stories);
    };

    getRecommendStory();
  }, []);

  return (
    <div className="w-full h-full flex flex-col font-afacad gap-12">
      <StoryGrid
        className="max-w-[1800] mx-auto"
        label={typeParam ? snakeCaseToCapitalizeWord(typeParam) : "Story"}
        storyType={typeParam}
        elementsPerPage={30}
      ></StoryGrid>

      <RecommendStories className="max-w-[1800] mx-auto"></RecommendStories>
    </div>
  );
}
