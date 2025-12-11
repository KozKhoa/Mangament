import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";

import storyService from "@/services/story";
import Story from "@/types/story";

import RankingCard from "../cards/ranking-card";

import ArrowRightIcon from "@/public/arrows/right-v.svg";
import ArrowLeftIcon from "@/public/arrows/left-v.svg";
import useInView from "@/hooks/useInView";

const limit = 5;
const page = 1;

const arrowClassName = "w-5 h-5 cursor-pointer";

export default function StoriesRankingList({ rankBy = "view", label, className }: { rankBy?: string; label?: string; className?: string }) {
  const [stories, setStories] = useState<Story[]>([]);
  const itemRef = useRef<HTMLDivElement>(null);
  const sliderRef = useRef<HTMLDivElement>(null);

  const [topSliderRef, topSliderInView] = useInView();
  const [endSliderRef, endSliderInView] = useInView();

  function slideToNextItem() {
    const itemWidth = itemRef.current?.offsetWidth;
    sliderRef.current?.scrollBy({ left: itemWidth });
  }

  function slideToPrevItem() {
    const itemWidth = itemRef.current?.offsetWidth;
    sliderRef.current?.scrollBy({ left: itemWidth ? -itemWidth : 0 });
  }

  async function fetchStories() {
    const res = await storyService.get({ page: page, limit: limit, sort: `${rankBy}:desc` });

    if (!res) return toast.warning("Cannot connect with server");
    if (!res.success) return toast.warning(res.message);

    console.log(res.data);

    setStories(res.data);
  }

  useEffect(() => {
    fetchStories();
  }, []);

  return (
    <div className={`px-2 py-1 border-2 rounded-md w-full ${className}`}>
      <div className="w-full flex flex-row justify-between items-center border-b-2">
        {!topSliderInView ? <ArrowLeftIcon onClick={slideToPrevItem} className={arrowClassName}></ArrowLeftIcon> : <div className={arrowClassName}></div>}

        <h2 className="font-bold text-2xl ">{label}</h2>

        {!endSliderInView ? <ArrowRightIcon onClick={slideToNextItem} className={arrowClassName}></ArrowRightIcon> : <div className={arrowClassName}></div>}
      </div>
      <div ref={sliderRef} className=" overflow-y-scroll scroll-smooth no-scrollbar snap-x snap-mandatory">
        <div className="flex flex-row w-fit">
          <div ref={topSliderRef as any}></div>
          {stories.map((story, i) => (
            <RankingCard ref={itemRef} className="snap-start w-[320px] lg:w-[400px]" top={i + 1} key={story.id} story={story}></RankingCard>
          ))}
          <div ref={endSliderRef as any}></div>
        </div>
      </div>
    </div>
  );
}
