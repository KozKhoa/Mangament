"use client";

import { Params } from "next/dist/server/request/params";
import { useParams } from "next/navigation";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { useRouter } from "next/navigation";

import storyService from "@/services/story";
import favouriteService from "@/services/favourite";

import StoryCardAllInfo from "@/components/cards/stories/story-card-all-info";
import StoryNodeList from "@/components/list/story-node-list";
import RatingList from "@/components/list/rating-list";
import CommentList from "@/components/list/comment-list";
import StoryList from "@/components/list/stories-list";

import StoryNode from "@/types/story-node";
import { StoryParams } from "@/types/params";
import Story from "@/types/story";
import useApp from "@/contexts/AppContext";
import path from "path";
import RecommendStories from "@/components/list/recommend-story";

function getParams(params: Params) {
  const rawType = params?.type;
  const type = Array.isArray(rawType) ? rawType[0] : rawType ?? "";

  const rawId = params?.id;
  const id = Array.isArray(rawId) ? rawId[0] : rawId ?? "";

  return { type, id };
}

export default function StoryDetailPage() {
  const router = useRouter();
  const params = useParams();
  const app = useApp();

  const { type, id } = getParams(params);
  const [story, setStory] = useState<Story>();
  const [review, setReview] = useState<string[]>();
  const [favouriteId, setFavouriteId] = useState<string>(story?.favourite ? story.favourite.id : "");

  async function fetchStory() {
    const storyParams: StoryParams = { id: id, isGettingChildren: true, isGettingSummary: true, type: type };

    const res = await storyService.get(storyParams);

    if (!res) toast.warning("Cannot connect with server");
    if (!res.success) return toast.warning(res.message);

    setStory(res.data);
    app?.setStory(res.data);
  }

  async function fetchStoryReview() {
    if (!story) return;
    const res = await storyService.getReview(story?.id);

    if (!res) toast.warning("Cannot connect with server");
    if (!res.success) return toast.warning(res.message);

    setReview(res.data);
  }

  async function addStoryToFavourite(storyId: string) {
    const res = await favouriteService.post({ storyId: storyId });
    if (!res) return toast.warning("Cannot connect with server");
    if (!res.success) return toast.warning(res.message);

    toast.message("Add successfully");

    setFavouriteId(res.data.favourite.id);

    return res.data;
  }

  async function removeStoryFromFavouite(favouriteId: string) {
    const res = await favouriteService.remove(favouriteId);

    if (!res) return toast.warning("Cannot connect with server");
    if (!res.success) return toast.warning(res.message);

    toast.message("Remove successfully");
    setFavouriteId("");
  }

  function toggleFavourite() {
    if (favouriteId) {
      removeStoryFromFavouite(favouriteId);
    } else {
      story && addStoryToFavourite(story?.id);
    }
  }

  function handleNavigateStoryNode(storyNode: StoryNode[]) {
    if (storyNode[storyNode.length - 1].type !== "chapter") return;

    let routeDir = "";
    storyNode.forEach((node, i) => (routeDir = path.join(routeDir, node.type, node.order_index.toString(), node.id)));
    router.push(path.join(`/story/${type}/${id}/`, routeDir));
  }

  useEffect(() => {
    setFavouriteId(story?.favourite ? story.favourite.id : "");
    fetchStoryReview();
  }, [story]);

  useEffect(() => {
    fetchStory();
  }, []);

  return (
    <div className="flex flex-col gap-10">
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
        <StoryNodeList onClickItem={handleNavigateStoryNode} className="lg:flex-1" storyNodes={story?.children} size={story?.number_of_chidren}></StoryNodeList>
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

      <RecommendStories className="max-w-[1800] mx-auto"></RecommendStories>
    </div>
  );
}
