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

const arrowClassName = "w-5 h-5 cursor-pointer ";

export default function StoriesRankingList({ rankBy = "view", label, className }: { rankBy?: string; label?: string; className?: string }) {
  const [stories, setStories] = useState<Story[]>([]);
  const sliderRef = useRef<HTMLDivElement>(null);

  const [topSliderRef, topSliderInView] = useInView();
  const [endSliderRef, endSliderInView] = useInView();

  function slideToNextItem() {
    const itemWidth = endSliderRef.current?.offsetWidth;
    sliderRef.current?.scrollBy({ left: itemWidth });
  }

  function slideToPrevItem() {
    const itemWidth = endSliderRef.current?.offsetWidth;
    sliderRef.current?.scrollBy({ left: itemWidth ? -itemWidth : 0 });
  }

  async function fetchStories() {
    const res = await storyService.get({ page: page, limit: limit, sort: `${rankBy}:desc` });

    if (!res) return toast.warning("Cannot connect with server");
    if (!res.success) return toast.warning(res.message);

    setStories(res.data);
  }

  useEffect(() => {
    const autoSlide = setInterval(() => {
      if (endSliderInView) {
        sliderRef.current?.scrollTo({ left: 0 });
      } else {
        slideToNextItem();
      }
    }, 4000);

    return () => {
      clearInterval(autoSlide);
    };
  }, [endSliderRef, endSliderInView]);

  useEffect(() => {
    fetchStories();
  }, []);

  return (
    <div className={`px-2 py-1 border-2 rounded-md w-full shadow-[5px_8px_4px_rgba(0,0,0,0.3)] ${className}`}>
      <div className="w-full flex flex-row justify-between items-center border-b-2 mb-2">
        {!topSliderInView ? <ArrowLeftIcon onClick={slideToPrevItem} className={arrowClassName}></ArrowLeftIcon> : <div className={arrowClassName}></div>}

        <h2 className="font-bold text-2xl">{label}</h2>

        {!endSliderInView ? <ArrowRightIcon onClick={slideToNextItem} className={arrowClassName}></ArrowRightIcon> : <div className={arrowClassName}></div>}
      </div>
      <div className="flex flex-row">
        <div
          ref={sliderRef}
          className="grid grid-flow-col auto-cols-[100%] sm:auto-cols-[50%] lg:auto-cols-[33.3333333%] overflow-y-scroll scroll-smooth no-scrollbar snap-x snap-mandatory"
        >
          {stories &&
            stories.length > 0 &&
            stories.map((story, i) => {
              const ref = i === stories.length - 1 ? (endSliderRef as any) : i === 0 ? (topSliderRef as any) : null;
              return (
                <div className="snap-start w-full" key={story.id} ref={ref}>
                  <RankingCard className="w-full " top={i + 1} story={story}></RankingCard>
                </div>
              );
            })}
        </div>
      </div>
    </div>
  );
}
