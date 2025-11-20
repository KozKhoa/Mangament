"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";

import StoryGrid from "@/components/grids/story-grid";

import { snakeCaseToCapitalizeWord } from "@/utils/string";

import Story from "@/types/story";

import storyService from "@/services/story";
import StoryList from "@/components/list/stories-list";

export default function StoriesPage() {
  const params = useParams();
  const rawType = params?.type;
  const typeParam = Array.isArray(rawType) ? rawType[0] : rawType ?? "";

  const [recommendedStories, setRecommendedStories] = useState<Story[]>();

  useEffect(() => {
    const getRecommendStory = async () => {
      const res = await storyService.get({ limit: 10 });

      const stories = res.data;

      setRecommendedStories(stories);
    };

    getRecommendStory();
  }, []);

  return (
    <div className="w-full h-full flex flex-col font-afacad gap-12">
      <StoryGrid className="max-w-[1800] mx-auto" label={typeParam ? snakeCaseToCapitalizeWord(typeParam) : "Story"} storyType={typeParam}></StoryGrid>

      <StoryList className="max-w-[1800] mx-auto" label="Gợi ý cho bạn" stories={recommendedStories}></StoryList>
    </div>
  );
}
