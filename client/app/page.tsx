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

export default function Home() {
  const router = useRouter();
  const auth = useAuth();

  const page = useRef(1);

  const [histories, setHistories] = useState<History[]>([]);

  async function fetchHistories() {
    const res = await historyService.get({ ...DEFAULT.params, ...{ page: 1, limit: 20 } });

    if (!res) return toast.warning("Server error");
    if (!res.success) return toast.warning(res.message);

    setHistories(res.data);
  }

  async function fetchMoreHistories(page: number) {
    const res = await historyService.get({ ...DEFAULT.params, ...{ page: page, limit: 20 } });

    if (!res) return toast.warning("Server error");
    if (!res.success) return toast.warning(res.message);

    setHistories((prev) => [...prev, ...res.data]);
  }

  async function removeHistory(history: History) {
    setHistories((prev) => prev.filter((x) => x !== history));
  }

  useEffect(() => {
    fetchHistories();
  }, []);

  return (
    <div className="flex flex-col gap-10  ">
      <StoriesRankingList label="Xem nhiều nhất" className="m-auto max-w-[1200px]" rankBy="view"></StoriesRankingList>

      <div className="flex flex-col gap-5">
        <h2 className="text-[2em] font-bold cursor-pointer border-b-2 w-fit m-auto">Danh mục truyện</h2>

        <div className="flex flex-row flex-wrap justify-center items-center gap-x-20 gap-y-10  m-auto w-fit">
          <CategoryCard imageSource="/manga.jpg" label="MANGA" onClick={() => router.push("/stories/manga")}></CategoryCard>
          <CategoryCard imageSource="/light_novel.jpg" label="LIGHT NOVEL" onClick={() => router.push("/stories/light_novel")}></CategoryCard>
        </div>
      </div>

      {auth?.user && (
        <InfinityScrollHorizontalList
          label="Tiếp tục đọc"
          onClickLabel={() => router.push("/histories")}
          onScrollToEnd={() => fetchMoreHistories(++page.current)}
        >
          {histories.map((history, i) => (
            <HistoryCard className="min-w-[150px] md:w-[200px]" key={history.id} history={history} onClickRemove={() => removeHistory(history)}></HistoryCard>
          ))}
        </InfinityScrollHorizontalList>
      )}
    </div>
  );
}
