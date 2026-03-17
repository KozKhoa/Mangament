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
import useAuth from "@/contexts/AuthContext";
import Link from "@/components/link/Link";
import Image from "next/image";
interface RatingGridProps {
  className?: string;
  storyId: string;
  elementPerPage?: number;

  allowAddNewRating?: boolean;
}

function RatingButton({ storyId, onSubmit }: { storyId: string; onSubmit?: (newRating?: Rating) => void }) {
  return (
    <button
      onClick={() => {
        modal.open("custom", {
          content: (
            <RatingInputForm
              onCancel={modal.close}
              onSubmit={(newRating) => {
                onSubmit?.(newRating);
                modal.close();
              }}
              storyId={storyId}
            ></RatingInputForm>
          ),
        });
      }}
      className="px-5 py-1 w-fit h-fit rounded-md select-none bg-foreground/10 text-foreground/80 cursor-pointer hover:bg-foreground/20"
    >
      Đánh giá ➤
    </button>
  );
}

export default function RatingMasonryGrid({ className, storyId, elementPerPage = 8, allowAddNewRating = true }: RatingGridProps) {
  const auth = useAuth();

  const user = auth?.user;

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

  async function handleGetMoreComments() {
    fetchMoreStoryComments();
  }

  function updateUiWithNewRating(newRating: Rating) {
    setRatings((prev) => [newRating, ...prev]);
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

        {allowAddNewRating && user && (
          <RatingButton
            storyId={storyId}
            onSubmit={(newRating) => {
              newRating && updateUiWithNewRating(newRating);
            }}
          />
        )}
      </div>

      {ratings.length > 0 ? (
        <>
          {ratings.length > elementPerPage ? (
            <MasonryGrid breakpointCols={breakpointColumnsObj}>
              {ratings.map((rating, i) => (
                <RatingCard
                  key={rating.id}
                  rating={rating}
                  className={`w-full border-2 ${auth?.user?.id == rating.user?.id ? "border-amber-500" : "border-transparent"}`}
                />
              ))}
            </MasonryGrid>
          ) : (
            <div className="grid grid-cols-2 gap-2 w-full">
              {ratings.map((rating, i) => (
                <RatingCard
                  key={rating.id}
                  className={`w-full border-2 ${auth?.user?.id == rating.user?.id ? "border-amber-500" : "border-transparent"}`}
                  rating={rating}
                />
              ))}
            </div>
          )}
        </>
      ) : (
        <>
          {!loading && allowAddNewRating && (
            <div className="flex flex-col justify-center items-center gap-2 md:text-[1.2em]">
              <div className="text-center p-10 py-5">
                {user ? (
                  "Chưa có đánh giá nào, hãy trở thành người đánh giá đầu tiên"
                ) : (
                  <Link href={"/login"} className="my-2">
                    <Image src="/login.png" alt="Require login" width={100} height={100} className="m-auto px-5 pt-5 pb-2 rounded-lg bg-white/80" />
                    <p className="m-auto my-3">Đăng nhập để để lại đánh giá</p>
                  </Link>
                )}
              </div>
              {user && (
                <RatingButton
                  storyId={storyId}
                  onSubmit={(newRating) => {
                    newRating && updateUiWithNewRating(newRating);
                  }}
                />
              )}
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
