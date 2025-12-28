"use client";

import RankingVerticalCard from "@/components/cards/ranking-vertical-card";
import StoryCard from "@/components/cards/stories/story-card";
import SlidingUnderlineSelection from "@/components/selections/sliding-underline-selection";
import storyService from "@/services/story";
import Story from "@/types/story";
import Loading from "@/components/loadings/loading";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";

const LIMIT = 50;

export default function RankingPage() {
  const router = useRouter();

  const params = useParams();
  const storyType = params.storyType?.toString();

  const listRef = useRef<HTMLDivElement>(null);
  const listItemsRef = useRef<Array<HTMLDivElement | null>>([]);

  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState(0);

  const [stories, setStories] = useState<Story[]>([]);

  async function fetchHostestStories() {
    setLoading(true);
    const res = await storyService.get({ type: storyType, limit: LIMIT, sort: "view:desc" });

    if (!res) return toast.warning("Cannot connect with server");
    if (!res.success) return toast.warning(res.message);

    setStories(res.data);
    setLoading(false);
  }

  async function fetchBestRankStories() {
    setLoading(true);
    const res = await storyService.get({ type: storyType, limit: LIMIT, sort: "star:desc" });

    if (!res) return toast.warning("Cannot connect with server");
    if (!res.success) return toast.warning(res.message);

    setStories(res.data);
    setLoading(false);
  }

  async function fetchNewestStories() {
    setLoading(true);
    const res = await storyService.get({ type: storyType, limit: LIMIT, sort: "updated_at:desc" });

    if (!res) return toast.warning("Cannot connect with server");
    if (!res.success) return toast.warning(res.message);

    setStories(res.data);
    setLoading(false);
  }

  useEffect(() => {
    if (selected === 0) fetchHostestStories();
    else if (selected === 1) fetchBestRankStories();
    else if (selected === 2) fetchNewestStories();
  }, [selected]);

  useEffect(() => {
    fetchHostestStories();
  }, []);

  return (
    <>
      <div className={`w-full flex flex-row justify-center items-start gap-5 `}>
        <div className="w-full flex flex-col gap-3">
          {/* Header use to display story type and page index */}
          <div
            className=" py-2 px-5 z-10 w-full
                flex flex-row flex-wrap justify-between items-center gap-2
                bg-background border-b-2 "
          >
            {/* Story type */}
            <h2 onClick={() => router.push("/ranking")} className="text-[2em] font-bold cursor-pointer">
              Xếp hạng
            </h2>
          </div>

          <SlidingUnderlineSelection
            onSelected={setSelected}
            defaultSelection={0}
            className="w-fit m-auto"
            labels={["Hot nhất", "Hay nhất", "Mới nhất"]}
          ></SlidingUnderlineSelection>

          {/* Main  */}
          <div className="">
            <div ref={listRef} className="flex w-full h-fit snap-mandatory overflow-hidden scroll-smooth">
              {loading ? (
                <Loading className="w-full h-64"></Loading>
              ) : stories?.length !== undefined && stories?.length > 0 ? (
                // Grid
                <div
                  className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-7 gap-2
                        border-b-2 border-foreground pb-2 place-items-center"
                >
                  {stories.map((story, i) => (
                    <div key={story.id} className="w-fit h-full">
                      <RankingVerticalCard className="h-full" top={i + 1} story={story}></RankingVerticalCard>
                    </div>
                  ))}
                </div>
              ) : (
                <></>
              )}
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
