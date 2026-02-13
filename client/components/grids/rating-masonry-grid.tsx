import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";

import MasonryGrid from "./masonry-grid";
import RatingCard from "../cards/rating-card";
import Loading from "../loadings/loading";

import { Pagination } from "@/types/pagination";
import Rating from "@/types/ratings";

import ratingService from "@/services/rating";
import { modal } from "../modal/modal.store";
import RatingInputForm from "../forms/rating-input-form";

interface RatingGridProps {
  className?: string;
  storyId: string;
  elementPerPage?: number;
}

function RatingButton({ storyId }: { storyId: string }) {
  return (
    <button
      onClick={() => {
        modal.open("custom", {
          content: <RatingInputForm onCancel={modal.close} onSubmit={modal.close} storyId={storyId}></RatingInputForm>,
        });
      }}
      className="px-5 py-1 w-fit h-fit rounded-md select-none bg-foreground/10 text-foreground/80 cursor-pointer hover:bg-foreground/20"
    >
      Đánh giá ➤
    </button>
  );
}

const SWITCH_LAYOUT = 4;

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
    const size = ratings.length;
    breakpointColumnsObj = {
      default: 4 < size ? 4 : size,
      1400: 4 < size ? 4 : size,
      1100: 3 < size ? 3 : size,
      700: 2 < size ? 2 : size,
      500: 2 < size ? 2 : size,
      300: 2 < size ? 2 : size,
    };
  }

  return (
    <div className={`flex flex-col justify-center items-center gap-2 w-full ${className}`}>
      <div className="w-full flex flex-row justify-between items-center">
        <h2 className="text-start px-1 font-semibold">
          Rating{" "}
          <span className="text-[0.6em] font-normal">
            ({ratings.length}/{pagination?.totalItems})
          </span>
        </h2>

        <RatingButton storyId={storyId}></RatingButton>
      </div>

      {ratings.length > 0 ? (
        <>
          {ratings.length > elementPerPage ? (
            <MasonryGrid breakpointCols={breakpointColumnsObj}>
              {ratings.map((rating, i) => (
                <RatingCard key={rating.id} rating={rating}></RatingCard>
              ))}
            </MasonryGrid>
          ) : (
            <div className="grid grid-cols-2 gap-2 w-full">
              {ratings.map((rating, i) => (
                <RatingCard className="w-full" key={rating.id} rating={rating}></RatingCard>
              ))}
            </div>
          )}
        </>
      ) : (
        <>
          {!loading && (
            <div className="flex flex-col justify-center items-center gap-2 md:text-[1.2em]">
              <p className="text-center p-10 py-5">Chưa có đánh giá nào, hãy trở thành người đánh giá đầu tiên</p>
              <RatingButton storyId={storyId}></RatingButton>
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
