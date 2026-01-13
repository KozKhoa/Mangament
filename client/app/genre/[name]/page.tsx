"use client";

import GenreCategoryCard from "@/components/cards/categories/genre-category-card";
import StoryGenreCard from "@/components/cards/stories/story-genre-card";
import MasonryGrid from "@/components/grids/masonry-grid";
import Loading from "@/components/loadings/loading";
import DEFAULT from "@/constants/default";
import GENRES from "@/constants/genres";
import useInView from "@/hooks/useInView";
import genreService from "@/services/genre";
import storyService from "@/services/story";
import { Pagination } from "@/types/pagination";
import Story from "@/types/story";
import { randomNumerInRange } from "@/utils/number";
import { snakeCaseToCapitalizeWord } from "@/utils/string";
import Link from "next/link";

import { useParams } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import Masonry from "react-masonry-css";
import { toast } from "sonner";

const LIMIT = 36;

type FeedItem = { type: "story"; data: Story } | { type: "genre_suggestion"; data: string[] } | { type: "banner"; data: any };

export default function StoryGenrePage() {
  const param = useParams();

  const genre = param.name?.toString();

  const [page, setPage] = useState(1);

  const [inViewRef, isInView] = useInView({ rootMargin: "0px 0px 100% 0px", threshold: 0.1 });

  const [stories, setStories] = useState<Story[] | null>(null);
  const [pagination, setPagination] = useState<Pagination>();
  const [feeds, setFeeds] = useState<FeedItem[] | null>(null);
  const [loading, setLoading] = useState(true);

  const buildFeed = useCallback((stories: Story[]) => {
    const feed: FeedItem[] = [];

    stories?.forEach((story, i) => {
      feed.push({ type: "story", data: story });

      if ((i + 1) % 24 === 0) {
        const start = (3 * ((i + 1) / 24 - 1)) % GENRES.length;
        feed.push({
          type: "genre_suggestion",
          data: GENRES.slice(start, start + 3),
        });
      }
    });

    return feed;
  }, []);

  async function fetchStories(page: number, limit: number) {
    if (!genre) return;

    setLoading(true);
    const res = await storyService.getStories({ ...DEFAULT.params, ...{ genre: [genre], page: page, limit: limit } });
    setLoading(false);

    if (!res) return toast.warning("Cannot connect with server");
    if (!res.success) return toast.warning(res.message);

    setStories(res.data ?? []);
    setPagination(res.pagination);

    setFeeds(buildFeed(res.data ?? []));
  }

  async function fetchMoreStories(page: number, limit: number) {
    if (!genre) return;

    setLoading(true);
    const res = await storyService.getStories({ ...DEFAULT.params, ...{ genre: [genre], page: page, limit: limit } });
    setLoading(false);

    if (!res) return toast.warning("Cannot connect with server");
    if (!res.success) return toast.warning(res.message);

    if (!res.data || res.data.length <= 0) return;

    setStories([...(stories || []), ...res.data]);
    setFeeds(buildFeed([...(stories || []), ...res.data]));
  }

  useEffect(() => {
    fetchStories(1, LIMIT);
  }, []);

  useEffect(() => {
    if (!stories) return;

    if (isInView) {
      setPage((prevPage) => {
        const newPage = prevPage + 1;

        fetchMoreStories(newPage, LIMIT);

        return newPage;
      });
    }
  }, [isInView]);

  return (
    <div>
      <h2 className="font-bold text-3xl m-auto w-fit mt-4">Thể loại</h2>

      <div className="  px-5 z-10 w-full flex flex-row flex-wrap justify-between items-center gap-2 border-b-2 ">
        <p className="text-[2em] font-bold cursor-pointer">
          {snakeCaseToCapitalizeWord(genre ?? "")} <span className="text-[0.6em] font-normal text-center h-full">({pagination?.totalItems})</span>
        </p>
      </div>

      {feeds && feeds.length > 0 && (
        <MasonryGrid className="mt-5">
          {feeds.map((feed, i) => (
            <div className="" key={i}>
              {feed.type === "story" ? (
                <StoryGenreCard key={feed.data.id} story={feed.data} className="border-4 hover:border-foreground bg-background-items" />
              ) : (
                feed.type === "genre_suggestion" && (
                  <div className="flex flex-col gap-2 justify-center items-center" key={i}>
                    <p className="text-[1.5em] font-semibold">Khám phá</p>
                    <div className="flex flex-col gap-2 p-1">
                      {feed.data.map((f, i) => (
                        <Link href={`/genre/${f}`} key={i}>
                          <GenreCategoryCard className="hover:scale-100" genre={f}></GenreCategoryCard>
                        </Link>
                      ))}
                    </div>
                  </div>
                )
              )}
            </div>
          ))}
        </MasonryGrid>
      )}
      <div ref={inViewRef as any}></div>
      {loading && <Loading className="h-64"></Loading>}
    </div>
  );
}
