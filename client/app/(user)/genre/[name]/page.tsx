"use client";

import GenreCategoryCard from "@/components/cards/categories/genre-category-card";
import StoryGenreCard from "@/components/cards/stories/story-genre-card";
import MasonryGrid from "@/components/grids/masonry-grid";
import Loading from "@/components/loadings/loading";
import SwitchPageSmall from "@/components/switch-page/small";
import DEFAULT from "@/constants/default";

import storyService from "@/services/story";
import { Pagination } from "@/types/pagination";
import Story from "@/types/story";
import { snakeCaseToCapitalizeWord } from "@/utils/string";

import { useParams, useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import { toast } from "sonner";

const LIMIT = 30;

type FeedItem = { type: "story"; data: Story } | { type: "genre_suggestion"; data: string[] } | { type: "banner"; data: any };

export default function StoryGenrePage() {
  const param = useParams();
  const router = useRouter();

  const genre = param.name?.toString();

  const searchParams = useSearchParams();
  const page = Number(searchParams.get("page") ?? 1);

  const [stories, setStories] = useState<Story[] | null>(null);
  const [pagination, setPagination] = useState<Pagination>();
  const [loading, setLoading] = useState(true);

  async function fetchStories(page: number, limit: number) {
    if (!genre) return;

    setLoading(true);
    const res = await storyService.getStories({ ...DEFAULT.params, ...{ genre: [genre], page: page, limit: limit } });
    setLoading(false);

    if (!res) return toast.warning("Cannot connect with server");
    if (!res.success) return toast.warning(res.message);

    setStories(res.data ?? []);
    setPagination(res.pagination);
  }

  useEffect(() => {
    fetchStories(page, LIMIT);
  }, [page]);

  return (
    <div className="m-2">
      <h2 className="font-bold text-3xl m-auto w-fit mt-4">Thể loại</h2>

      <div className="  px-5 z-10 w-full flex flex-row flex-wrap justify-between items-center gap-2 border-b-2 ">
        <p className="text-[2em] font-bold cursor-pointer">
          {snakeCaseToCapitalizeWord(genre ?? "")} <span className="text-[0.6em] font-normal text-center h-full">({pagination?.totalItems})</span>
        </p>
      </div>

      {stories && stories.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-2.5">
          {stories.map((story, i) => (
            <StoryGenreCard key={story.id} story={story} className="bg-background-items" />
          ))}
        </div>
      )}

      <div className="w-full flex justify-center items-center m-5">
        <SwitchPageSmall
          maxPage={pagination?.totalPages ?? 0}
          page={page}
          onChange={(pageIndex) => {
            router.push(`/genre/${genre}?page=${pageIndex}`);
          }}
        />
      </div>
      {loading && <Loading className="h-64"></Loading>}
    </div>
  );
}
