"use client";

import { toast } from "sonner";
import { useEffect, useState } from "react";

import Rating from "@/types/ratings";
import { RatingParams } from "@/types/params";

import ratingService from "@/services/rating";

import SwitchPageBig from "../switch-page/big";
import FilterRatings from "../filters/filter-ratings";
import RatingBox from "../boxs/rating-box";

import useAuth from "@/contexts/AuthContext";
import RatingInput from "../inputs/rating-input";
import Story from "@/types/story";
import DEFAULT from "@/constants/default";

interface RatingList {
  story?: Story;
  userId?: string;
  elementPerPage?: number;

  className?: string;
}

export default function RatingList({ story, elementPerPage = 5, className }: RatingList) {
  const auth = useAuth();
  const user = auth?.user;

  const [page, setPage] = useState<number>(1);
  const [rating, setRating] = useState<Rating[]>([]);
  const [count, setCount] = useState<number>(0);
  const [params, setParams] = useState<RatingParams>(DEFAULT.params);
  const [isRated, setIsRated] = useState<boolean>(story?.rating ? true : false);
  const [yourRating, setYourRating] = useState<Rating>();

  async function fetchRating() {
    if (!story?.id) return;

    const resRating = await ratingService.get(story?.id, params);
    const resCount = await ratingService.count(story?.id, params);

    if (!resRating || !resCount) return toast.error("Sever error");
    if (!resRating.success) return toast.warning(resRating.message);

    setRating(resRating.data);
    setCount(resCount.data);
  }

  function updateParams(params: {}) {
    setParams((prev) => {
      return {
        ...prev,
        ...params,
      };
    });
  }

  async function postRating(message: string, star: number) {
    const res = await ratingService.post(story?.id || "", user?.id || "", star, message);

    if (!res) return toast.warning("Cannot connect with server");
    if (!res.success) return toast.warning(res.message);

    fetchRating();
    setIsRated(true);
    setYourRating({ ...res.data.rating, user });

    return toast.message(res.message);
  }

  useEffect(() => {
    fetchRating();
  }, [params]);

  useEffect(() => {
    setParams((prev) => {
      return {
        ...prev,
        page: page,
      };
    });
  }, [page]);

  useEffect(() => {
    fetchRating();
    setIsRated(!!story?.rating);
    setYourRating(story?.rating);
  }, [story]);

  return (
    <div className={`flex flex-col gap-1  ${className}`}>
      <h2 className="font-bold m-auto border-b-2">Đánh giá</h2>
      {isRated ? (
        <div>
          <h3>Đánh giá của bạn</h3>
          <RatingBox rating={yourRating}></RatingBox>
        </div>
      ) : (
        <RatingInput onFinish={postRating}></RatingInput>
      )}

      <div className="flex flex-col gap-2.5 justify-center ml-2 md:ml-10">
        <div className="flex flex-row flex-wrap justify-between items-center">
          <h3>{count} đánh giá khác</h3>

          {/* <FilterRatings onFilter={updateParams}></FilterRatings> */}
        </div>

        {count ? (
          <>
            <div className="flex flex-col gap-2.5">
              {rating?.map((v, i) => (
                <RatingBox key={i} rating={v}></RatingBox>
              ))}
            </div>
            <SwitchPageBig className="m-auto" page={page} maxPage={Math.ceil(count / elementPerPage)} onChange={setPage}></SwitchPageBig>
          </>
        ) : (
          <div className="flex flex-col justify-center items-center p-2">
            <h3 className="font-bold">Không có đánh giá nào khác</h3>
            <p>Hãy trở thành người đánh giá đầu tiên hoặc điều chỉnh bộ lọc</p>
          </div>
        )}
      </div>
    </div>
  );
}
