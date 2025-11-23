import { toast } from "sonner";
import { useEffect, useState } from "react";

import Comment from "@/types/comment";
import Rating from "@/types/ratings";
import { RatingParams } from "@/types/params";
import { CommentParams } from "@/types/params";

import ratingService from "@/services/rating";
import SwitchPageBig from "../switch-page/big";
import FilterRatings from "../filters/filter-ratings";
import FilterSort from "./filter-sort";
import SortStories from "../sorts/sort-stories";
import RatingCommentBox from "../inputs/rating-comment";

interface RatingCommentListProps {
  type: "rating" | "comment";
  storyId?: string;
  storyNodeId?: string;
}

const limit = 12;

export default function RatingCommentList({ type, storyId, storyNodeId }: RatingCommentListProps) {
  const [page, setPage] = useState<number>(1);
  const [countValue, setCountValue] = useState<number>(0);
  const [value, setValue] = useState<Rating[] | Comment[]>();
  const [params, setParams] = useState<RatingParams | CommentParams>({ sort: "created_at:desc" });

  async function fetchRating() {
    if (!storyId) return;
    const resRating = await ratingService.get(storyId, params);
    const resCount = await ratingService.count(storyId, params);

    if (!resRating || !resCount) return toast.error("Sever error");
    if (!resRating.success) return toast.warning(resRating.message);

    console.log("Rating = ", resCount.data, resRating.data);

    setValue(resRating.data);
    setCountValue(resCount.data);
  }

  async function updateParams(options: { label: string; code?: string; isChecked: boolean }[], field: string) {
    let result: string[] = [];
    options.forEach((op, i) => {
      if (op.isChecked && op.code) result.push(op.code);
    });

    setParams({ [field]: result, page: page });
  }

  useEffect(() => {
    fetchRating();
    // console.log(params);
  }, [params]);

  return (
    <div className="flex flex-col gap-2.5">
      <div className="flex flex-row flex-wrap justify-between items-center">
        <h3>
          {countValue} {type === "rating" ? "đánh giá" : "bình luận"} khác
        </h3>
        <div>
          <FilterRatings onFilter={(e) => updateParams(e, "star")}></FilterRatings>
        </div>
      </div>
      <div className="flex flex-col gap-2.5">
        {value?.map((v, i) => {
          console.log(i, v);

          return <RatingCommentBox key={i} type={type} isEdited={false} value={v}></RatingCommentBox>;
        })}
      </div>
      <div>
        <SwitchPageBig page={page} maxPage={Math.ceil(countValue / limit)} onChange={setPage}></SwitchPageBig>
      </div>
    </div>
  );
}
