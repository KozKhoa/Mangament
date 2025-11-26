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
import RatingList from "@/components/list/rating-list";
import CommentList from "@/components/list/comment-list";

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
  const [favouriteId, setFavouriteId] = useState<string>(story?.favourite ? story.favourite.id : "");

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

    setFavouriteId(res.data.favourite.id);

    return res.data;
  }

  async function removeStoryFromFavouite(favouriteId: string) {
    const res = await favouriteService.remove(favouriteId);

    if (!res) return toast.warning("Server Error");
    if (!res.success) return toast.warning(res.message);

    toast.message("Remove successfully");
    setFavouriteId("");
  }

  function toggleFavourite() {
    console.log(favouriteId);
    if (favouriteId) {
      removeStoryFromFavouite(favouriteId);
    } else {
      story && addStoryToFavourite(story?.id);
    }
  }

  useEffect(() => {
    setFavouriteId(story?.favourite ? story.favourite.id : "");
    fetchStoryReview();
  }, [story]);

  useEffect(() => {
    fetchStory();
  }, []);

  return (
    <div className="flex flex-col gap-10 font-afacad">
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
              className={`w-full py-1.5 font-semibold border-2 border-foreground text-center rounded-sm ${favouriteId && "bg-red-400 text-white"}`}
            >
              {favouriteId ? "Đã yêu thích" : "Yêu thích"}
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

      <div className="flex flex-col gap-5 w-full h-full p-2.5 border-2 rounded-md">
        <RatingList className="w-full" story={story}></RatingList>
        <CommentList className="w-full" story={story}></CommentList>
      </div>
    </div>
  );
}
