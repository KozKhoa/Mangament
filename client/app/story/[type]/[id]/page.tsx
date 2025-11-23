"use client";

import StoryCardAllInfo from "@/components/cards/stories/story-card-all-info";
import RatingCommentBox from "@/components/inputs/rating-comment";
import StoryNodeList from "@/components/list/story-node-list";
import storyService from "@/services/story";
import favouriteService from "@/services/user/favourite";
import { RatingParams, StoryParams } from "@/types/params";
import Story from "@/types/story";
import { Params } from "next/dist/server/request/params";
import { useParams } from "next/navigation";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import ratingService from "@/services/rating";
import Rating from "@/types/ratings";
import RatingCommentList from "@/components/list/rating-comment-list";

function getParams(params: Params) {
  const rawType = params?.type;
  const type = Array.isArray(rawType) ? rawType[0] : rawType ?? "";

  const rawId = params?.id;
  const id = Array.isArray(rawId) ? rawId[0] : rawId ?? "";

  return { type, id };
}

export default function StoryDetail() {
  const params = useParams();
  const { type, id } = getParams(params);

  const [story, setStory] = useState<Story>();
  const [review, setReview] = useState<string[]>();

  const [ratings, setRatings] = useState<Rating[]>();
  const [ratingParams, setRatingParams] = useState<RatingParams>({ sort: "created_at:desc" });

  const [isInFavourite, setIsInFavourite] = useState<boolean>(story?.favourite ? true : false);

  async function fetchStory() {
    const storyParams: StoryParams = { id: id, isGettingChildren: true, isGettingSummary: true, type: type };

    const res = await storyService.get(storyParams);

    if (!res) toast.warning("Server Error");
    if (!res.success) return toast.warning(res.message);

    setStory(res.data);
    console.log(res.data);
  }

  async function fetchStoryReview() {
    if (!story) return;
    const res = await storyService.getReview(story?.id);

    if (!res) toast.warning("Server Error");
    if (!res.success) return toast.warning(res.message);

    setReview(res.data);
  }

  async function fetchRating() {
    const res = await ratingService.get(id, ratingParams);

    if (!res) return toast.error("Sever error");
    if (!res.success) return toast.warning(res.message);
  }

  async function addStoryToFavourite(storyId: string) {
    const res = await favouriteService.post({ storyId: storyId });
    if (!res) return toast.warning("Server Error");
    if (!res.success) return toast.warning(res.message);

    toast.message("Add successfully");
    setIsInFavourite(true);
  }

  async function removeStoryFromFavouite(favouriteId: string) {
    const res = await favouriteService.remove(favouriteId);

    if (!res) return toast.warning("Server Error");
    if (!res.success) return toast.warning(res.message);

    toast.message("Remove successfully");
    setIsInFavourite(false);
  }

  function toggleFavourite() {
    if (isInFavourite) {
      story?.favourite?.id && removeStoryFromFavouite(story?.favourite.id);
    } else {
      story && addStoryToFavourite(story?.id);
    }
  }

  useEffect(() => {
    setIsInFavourite(story?.favourite ? true : false);
    fetchStoryReview();
  }, [story]);

  useEffect(() => {
    fetchStory();
  }, []);

  useEffect(() => {
    fetchRating();
  }, [ratingParams]);

  return (
    <div className="w-full flex flex-col gap-10 font-afacad">
      <div className="flex flex-col lg:flex-row gap-5">
        {/* Story info */}
        <div className="lg:flex-1 flex flex-col gap-3">
          <StoryCardAllInfo story={story}></StoryCardAllInfo>

          {/* Button */}
          <div className="grid grid-cols-2 md:grid-cols-4 justify-center items-center gap-2">
            <button className="w-full py-1.5 font-semibold border-2 border-foreground text-center rounded-sm bg-foreground text-background ">Đọc từ đầu</button>
            <button className="w-full py-1.5 font-semibold border-2 border-foreground text-center rounded-sm bg-foreground text-background ">
              Đọc từ cuối
            </button>
            <button className="w-full py-1.5 font-semibold border-2 border-foreground text-center rounded-sm bg-foreground text-background ">Đọc tiếp</button>
            <button
              onClick={toggleFavourite}
              className={`w-full py-1.5 font-semibold border-2 border-foreground text-center rounded-sm ${isInFavourite && "bg-red-400 text-white"}`}
            >
              {isInFavourite ? "Đã yêu thích" : "Yêu thích"}
            </button>
          </div>
        </div>

        {/* Chapter list */}
        <StoryNodeList className="lg:flex-1" storyNodes={story?.children} size={story?.number_of_chidren}></StoryNodeList>
      </div>

      {/* Review */}
      <div className="flex flex-col border-2 border-foreground rounded-md px-5 py-2.5 gap-7">
        <h2 className="w-full text-center border-b-2 border-foreground font-semibold">Xem trước</h2>
        <div
          className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 
            gap-5"
        >
          {review?.map((url, i) => (
            <div key={i} className="border rounded-sm overflow-hidden">
              <img src={process.env.NEXT_PUBLIC_API_URL + "uploads/story/" + url} alt={`review ${i}`}></img>
            </div>
          ))}
        </div>
      </div>

      <RatingCommentBox isEdited={false} type="rating" value={ratings?.[0]}></RatingCommentBox>
      <RatingCommentBox isEdited={true} type="rating" value={ratings?.[0]}></RatingCommentBox>
      <RatingCommentBox isEdited={false} type="comment"></RatingCommentBox>

      <RatingCommentList type="rating" storyId="170b4fd6-9947-49dc-be94-0663174d5e42"></RatingCommentList>
    </div>
  );
}
