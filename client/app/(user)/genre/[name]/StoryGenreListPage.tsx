"use client";

import GenreCategoryCard from "@/components/cards/categories/genre-category-card";
import StoryGenreCard from "@/components/cards/stories/story-genre-card";
import MasonryGrid from "@/components/grids/masonry-grid";
import Navbar from "@/components/layouts/navbar";
import Loading from "@/components/loadings/loading";
import { loadingBar } from "@/components/loadings/loading-bar/top-loading-bar.store";
import SwitchPageSmall from "@/components/switch-page/small";
import DEFAULT from "@/constants/default";
import { routes } from "@/lib/routes";

import storyService from "@/services/story";
import { Pagination } from "@/types/pagination";
import Story from "@/types/story";
import { snakeCaseToCapitalizeWord } from "@/utils/string";

import { useParams, useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import { toast } from "sonner";

const LIMIT = 30;

export default function StoryGenreListPage() {
  const param = useParams();
  const router = useRouter();

  const genre = decodeURIComponent(param.name?.toString() ?? "");

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

    loadingBar.close();
  }, [page]);

  return (
    <div className="m-2">
      <Navbar
        items={["Genre", snakeCaseToCapitalizeWord(genre ?? "")]}
        onClickItem={(i) => {
          if (i === 0) router.push(routes.genre());
          else if (i === 1) router.push(routes.genre({ genre: genre ?? "" }));
        }}
        className="p-2 px-3"
      />
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
            router.push(`${routes.genre({ genre: genre })}?page=${pageIndex}`);
          }}
        />
      </div>
      {loading && <Loading className="h-64"></Loading>}
    </div>
  );
}
