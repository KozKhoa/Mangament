import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";

import SearchBar from "./search";
import StorySearchCard from "../cards/stories/story-search-card";

import Story from "@/types/story";

import storyService from "@/services/story";
import useInView from "@/hooks/useInView";
import Loading from "../loadings/loading";

export default function SearchStories({ className }: { className?: string }) {
  const [inViewRef, isInView] = useInView();
  const page = useRef(1);
  const keyword = useRef("");

  const [stories, setStories] = useState<Story[] | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  async function fetchSearchStories() {
    if (keyword.current.length < 3) {
      setStories(null);
      return;
    }

    setIsLoading(true);
    const res = await storyService.getStories({ keyword: keyword.current, limit: 10, sort: "view:desc", page: page.current });

    if (!res) return toast.warning("Cannot connect with server");
    if (!res.success) return toast.warning(res.message);

    setStories(res.data ?? []);
    setIsLoading(false);
  }

  async function fetchMoreResult() {
    if (keyword.current.length < 3) {
      setStories(null);
      return;
    }

    setIsLoading(true);
    const res = await storyService.getStories({ keyword: keyword.current, limit: 10, sort: "view:desc", page: ++page.current });

    if (!res) return toast.warning("Cannot connect with server");
    if (!res.success) return toast.warning(res.message);

    const stories = res.data ?? [];

    setStories((prev) => {
      if (!prev || prev.length <= 0) return stories;
      return [...prev, ...stories];
    });

    setIsLoading(false);
  }

  useEffect(() => {
    if (isInView) fetchMoreResult();
  }, [isInView]);

  return (
    <SearchBar
      className={`${className}`}
      onType={(text) => {
        page.current = 1;
        keyword.current = text;
        fetchSearchStories();
      }}
    >
      {stories && (
        <>
          {stories.length > 0 ? (
            <>
              {stories.map((story, i) => (
                <StorySearchCard key={story.id} story={story}></StorySearchCard>
              ))}
              {isLoading && <Loading className="w-full"></Loading>}
            </>
          ) : (
            <p className="text-xl w-full p-5">Không có kết quả</p>
          )}
          <div ref={inViewRef as any}></div>
        </>
      )}
    </SearchBar>
  );
}
