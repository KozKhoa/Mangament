"use client";

import { useEffect, useState } from "react";
import { ReadonlyURLSearchParams, useParams, useSearchParams } from "next/navigation";

import { snakeCaseToCapitalizeWord } from "@/utils/string";

import Story from "@/types/story";

import storyService from "@/services/story";

import StoryGridWithInfoCard from "@/components/grids/story-grid";
import RecommendStories from "@/components/list/recommend-story";
import { toast } from "sonner";

function getSearchParams(searchParams: ReadonlyURLSearchParams) {
  const page = Number(searchParams.get("page") ?? 1);
  const sort = searchParams.get("sort") ?? "";

  const authorIds = searchParams.get("authorIds")?.split(",");
  const star = searchParams.get("star");
}

export default function StoriesPage() {
  const params = useParams();
  const searchParams = useSearchParams();

  const page = Number(searchParams.get("page") ?? 1);
  const sort = searchParams.get("sort") ?? "";

  console.log(sort, page);

  const rawType = params?.type;
  const typeParam = Array.isArray(rawType) ? rawType[0] : rawType ?? "";

  const [recommendedStories, setRecommendedStories] = useState<Story[]>();

  useEffect(() => {
    const getRecommendStory = async () => {
      const res = await storyService.getStories({ limit: 10 });

      if (!res) return toast.warning("Cannot connect with server");
      if (!res.success) return toast.warning(res.message);

      const stories = res.data;

      setRecommendedStories(stories);
    };

    getRecommendStory();
  }, []);

  return (
    <div className="w-full h-full flex flex-col font-afacad gap-12">
      <StoryGridWithInfoCard
        className="max-w-[1800] mx-auto"
        label={typeParam ? snakeCaseToCapitalizeWord(typeParam) : "Story"}
        storyType={typeParam}
        elementsPerPage={30}
      ></StoryGridWithInfoCard>

      <RecommendStories className="max-w-[1800] mx-auto"></RecommendStories>
    </div>
  );
}
