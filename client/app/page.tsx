"use client";

import StoriesRankingList from "@/components/list/stories-ranking-list";
import StoryList from "@/components/list/stories-list";
import { useRouter } from "next/navigation";
import RatingList from "@/components/list/rating-list";
import InfinityScrollHorizontalList from "@/components/list/infinity-scroll-horizontal-list";
import { useEffect, useRef, useState } from "react";

import historyService from "@/services/history";
import DEFAULT from "@/constants/default";
import { toast } from "sonner";
import HistoryCard from "@/components/cards/history-card";
import History from "@/types/history";
import useAuth from "@/contexts/AuthContext";
import CategoryCard from "@/components/cards/category-card";
import storyService from "@/services/story";
import Story from "@/types/story";
import StoryCard from "@/components/cards/stories/story-card";
import RankingCard from "@/components/cards/ranking-card";
import NoContent from "@/components/cards/no-content";

export default function Home() {
  const router = useRouter();
  const auth = useAuth();

  const [histories, setHistories] = useState<History[] | null>(null);
  const [newestStories, setNewestStories] = useState<Story[]>([]);
  const [bestRankingStories, setBestRankingStories] = useState<Story[]>([]);

  async function fetchHistories() {
    const res = await historyService.get({ ...DEFAULT.params, ...{ page: 1, limit: 20 } });

    if (!res) return toast.warning("Server error");
    if (!res.success) return toast.warning(res.message);

    setHistories(res.data);
  }

  async function fetchNewestStories() {
    const res = await storyService.get({ page: 1, limit: 20, sort: "updated_at:desc", isGettingNewestChapter: true });

    if (!res) return toast.warning("Server Error");
    if (!res.success) return toast.warning(res.message);

    setNewestStories(res.data);
  }

  async function fetchBestRankingStories() {
    const res = await storyService.get({ page: 1, limit: 10, sort: "star:desc" });

    if (!res) return toast.warning("Server Error");
    if (!res.success) return toast.warning(res.message);

    setBestRankingStories(res.data);
  }

  async function removeHistory(history: History) {
    setHistories((prev) => (prev ? prev.filter((x) => x !== history) : null));
  }

  useEffect(() => {
    fetchHistories();
    fetchNewestStories();
    fetchBestRankingStories();
  }, []);

  return (
    <div className="flex flex-col gap-10  ">
      {/* Ranking */}
      <StoriesRankingList label="Xem nhiều nhất" className="m-auto max-w-[1200px]" rankBy="view"></StoriesRankingList>

      {/* Story type */}
      <div className="flex flex-col gap-5">
        <h2 className="text-[2em] font-bold cursor-pointer border-b-2 w-fit m-auto">Danh mục truyện</h2>

        <div className="flex flex-row flex-wrap justify-center items-center gap-x-20 gap-y-10  m-auto w-fit">
          <CategoryCard className="hover:scale-115" imageSource="/manga.jpg" label="MANGA" onClick={() => router.push("/stories/manga")}></CategoryCard>
          <CategoryCard
            className="hover:scale-115"
            imageSource="/light_novel.jpg"
            label="LIGHT NOVEL"
            onClick={() => router.push("/stories/light_novel")}
          ></CategoryCard>
        </div>
      </div>

      {/* Continue reading */}
      {auth?.user && (
        <InfinityScrollHorizontalList
          label="Tiếp tục đọc"
          onClickLabel={() => router.push("/histories")}
          isLoading={histories === null}
          isNoContent={histories ? histories.length <= 0 : true}
        >
          {histories?.map((history, i) => (
            <HistoryCard key={history.id} history={history} onClickRemove={() => removeHistory(history)}></HistoryCard>
          ))}
        </InfinityScrollHorizontalList>
      )}

      {/* Latest update */}
      <InfinityScrollHorizontalList label="Mới cập nhật" isLoading={newestStories.length <= 0}>
        {newestStories.map((story, i) => (
          <StoryCard key={story.id} data={story}></StoryCard>
        ))}
      </InfinityScrollHorizontalList>

      {/*Genres list */}
      <InfinityScrollHorizontalList
        label="Tag nổi bật"
        onClickLabel={() => {}}
        numberOfElementInScreen={{ basic: 1, sm: 2, md: 2, lg: 3, xl: 4 }}
        autoSlide={3000}
      >
        <div className="py-3.5 px-5">
          <CategoryCard className="m-auto" imageSource="/genres/comedy.jpg" label="COMEDY"></CategoryCard>
        </div>
        <div className="py-3.5 px-5">
          <CategoryCard className="m-auto" imageSource="/genres/fantasy.jpg" label="FANTASY"></CategoryCard>
        </div>
        <div className="py-3.5 px-5">
          <CategoryCard className="m-auto" imageSource="/genres/harem.jpg" label="HAREM"></CategoryCard>
        </div>
        <div className="py-3.5 px-5">
          <CategoryCard className="m-auto" imageSource="/genres/isekai.jpg" label="ISEKAI"></CategoryCard>
        </div>
        <div className="py-3.5 px-5">
          <CategoryCard className="m-auto" imageSource="/genres/romance.jpg" label="ROMANCE"></CategoryCard>
        </div>
        <div className="py-3.5 px-5">
          <CategoryCard className="m-auto" imageSource="/genres/shonen.jpg" label="SHONEN"></CategoryCard>
        </div>
        <div className="py-3.5 px-5">
          <CategoryCard className="m-auto" imageSource="/genres/slice_of_life.jpg" label="SLICE OF LIFE"></CategoryCard>
        </div>
        <div className="py-3.5 px-5">
          <CategoryCard className="m-auto" imageSource="/genres/sport.jpg" label="SPORT"></CategoryCard>
        </div>
      </InfinityScrollHorizontalList>

      {/* Best ranking stories */}
      <InfinityScrollHorizontalList
        label="Đánh giá cao nhất"
        numberOfElementInScreen={{ basic: 1, sm: 2, md: 2, lg: 3, xl: 4 }}
        isLoading={bestRankingStories.length <= 0}
        autoSlide={4000}
      >
        {bestRankingStories.map((story, i) => (
          <div key={story.id} className="px-5">
            <RankingCard story={story} top={i + 1}></RankingCard>
          </div>
        ))}
      </InfinityScrollHorizontalList>
    </div>
  );
}
