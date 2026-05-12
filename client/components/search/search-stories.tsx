import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";

import SearchBar from "./search";
import Loading from "../loadings/loading";
import StorySearchCard from "../cards/stories/story-search-card";

import Story from "@/types/story";

import storyService from "@/services/story";
import { useRouter } from "next/navigation";

const LIMIT = 30;

export default function SearchStories({ className, delay = 500 }: { className?: string; delay?: number }) {
  const router = useRouter();

  const page = useRef(1);

  const [stories, setStories] = useState<Story[] | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [keyword, setKeyword] = useState("");

  async function fetchSearchStories() {
    setIsLoading(true);
    const res = await storyService.getStories({ keyword: keyword, limit: LIMIT, sort: "view:desc", page: page.current });

    if (!res.success) return toast.warning(res.message);

    setStories(res.data ?? []);
    setIsLoading(false);
  }

  async function handleSearch() {
    if (!keyword || keyword.length < 3) {
      toast.message("Tối thiểu 3 ký tự");
      return;
    }

    router.push(`/search?keyword=${keyword}`);
  }

  useEffect(() => {
    if (!keyword || keyword.length < 3) {
      setStories(null);
      return;
    }

    fetchSearchStories();
  }, [keyword]);

  return (
    <SearchBar className={`${className}`} onType={setKeyword} onSearch={handleSearch} delay={delay} placeHolder="Nhập tối thiểu 3 ký tự">
      {(isLoading || stories) && (
        <>
          {isLoading && <Loading className="h-32 w-[30px] m-auto" />}
          {stories && (
            <>
              {stories.length > 0 ? (
                <>
                  {stories.map((story) => (
                    <StorySearchCard key={story.id} story={story} />
                  ))}
                </>
              ) : (
                <p className="text-xl w-full p-5">Không có kết quả</p>
              )}
            </>
          )}
        </>
      )}
    </SearchBar>
  );
}
