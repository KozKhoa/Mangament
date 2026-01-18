import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";

import MasonryGrid from "./masonry-grid";
import RatingCard from "../cards/rating-card";
import Loading from "../loadings/loading";

import { Pagination } from "@/types/pagination";
import Rating from "@/types/ratings";

import ratingService from "@/services/rating";

interface RatingGridProps {
  className?: string;
  storyId: string;
  elementPerPage?: number;
}

export default function RatingMasonryGrid({ className, storyId, elementPerPage = 8 }: RatingGridProps) {
  const page = useRef(1);
  const [ratings, setRatings] = useState<Rating[]>([]);
  const [pagination, setPagination] = useState<Pagination>();
  const [loading, setLoading] = useState(true);

  async function fetchMoreStoryComments() {
    if (!storyId) return;

    setLoading(true);
    const res = await ratingService.getRatings(storyId, { limit: elementPerPage, page: page.current });
    setLoading(false);

    if (!res.success) return toast.warning(res.message);

    const newRatings: Rating[] = res.data ?? [];

    setRatings((prevRating) => [...prevRating, ...newRatings]);
  }

  function handleGetMoreComments() {
    fetchMoreStoryComments();
  }

  useEffect(() => {
    async function fetchStoryComments() {
      if (!storyId) return;

      setLoading(true);
      const res = await ratingService.getRatings(storyId, { limit: elementPerPage, page: 1 });
      setLoading(false);

      if (!res.success) return toast.warning(res.message);

      setRatings(res.data ?? []);
      setPagination(res.pagination);
    }

    fetchStoryComments();
  }, [storyId]);

  const isMoreContent = ratings.length < (pagination?.totalItems ?? 0);
  const contentLeft = (pagination?.totalItems ?? 0) - ratings.length;

  let breakpointColumnsObj;
  if (ratings.length < elementPerPage) {
    breakpointColumnsObj = {
      default: 4,
      1400: 4,
      1100: 3,
      700: 2,
      500: 2,
      300: 2,
    };
  } else {
    breakpointColumnsObj = {
      default: 6,
      1400: 5,
      1100: 4,
      700: 3,
      500: 2,
      300: 1,
    };
  }

  return (
    <div className={`flex flex-col justify-center items-center gap-2 ${className}`}>
      <h2 className="w-full text-start px-1 font-semibold">
        Rating{" "}
        <span className="text-[0.6em] font-normal">
          ({ratings.length}/{pagination?.totalItems})
        </span>
      </h2>

      {ratings.length > 0 ? (
        <MasonryGrid breakpointCols={breakpointColumnsObj}>
          {ratings.map((commment, i) => (
            <RatingCard key={commment.id} rating={commment}></RatingCard>
          ))}
        </MasonryGrid>
      ) : (
        <>
          {!loading && (
            <div className="flex flex-col justify-center items-center gap-2 md:text-[1.2em]">
              <p className="text-center p-10 py-5">Chưa có đánh giá nào, hãy trở thành người đánh giá đầu tiên</p>
              <button className="px-5 py-1 w-fit h-fit rounded-md select-none bg-foreground/10 text-foreground/80 cursor-pointer hover:bg-foreground/20">
                Đánh giá ➤
              </button>
            </div>
          )}
        </>
      )}

      {loading && <Loading className="h-24" />}

      {ratings.length > 0 && (
        <button
          onClick={() => {
            page.current++;
            handleGetMoreComments();
          }}
          disabled={!isMoreContent}
          className={`px-5 py-1 w-fit h-fit rounded-md select-none bg-foreground/10 text-foreground/80 
            ${isMoreContent ? "cursor-pointer hover:bg-foreground/20" : ""}`}
        >
          {isMoreContent ? `Show more (${contentLeft})` : "You are at the end"}
        </button>
      )}
    </div>
  );
}
