"use client";

import path from "path";
import { toast } from "sonner";
import { useParams } from "next/navigation";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Params } from "next/dist/server/request/params";

import useAuth from "@/contexts/AuthContext";

import storyService from "@/services/story";
import favouriteService from "@/services/favourite";

import Story from "@/types/story";
import StoryNode from "@/types/story-node";

import Button from "@/components/buttons/button";

import StoryNodeList from "@/components/list/story-node-list";
import RecommendStories from "@/components/list/recommend-story";
import StoryCardAllInfo from "@/components/cards/stories/story-card-all-info";
import ButtonOfFavouriteStory from "@/components/buttons/favourite-button";
import CommentMasonryGrid from "@/components/grids/comment-masonry-grid";
import RatingMasonryGrid from "@/components/grids/rating-masonry-grid";
import { modal } from "@/components/modal/modal.store";
import RatingInputForm from "@/components/forms/rating-input-form";
import Image from "next/image";

export default function StoryDetailPage() {
  const router = useRouter();
  const params = useParams();

  const storyType = params.storyType?.toString().split(",");
  const title = params.title?.toString();

  const [story, setStory] = useState<Story>();
  const [review, setReview] = useState<string[]>();

  async function fetchStory() {
    const res = await storyService.getStoryByTitle(title ?? "", { isGettingChildren: true, isGettingSummary: true, type: storyType });

    if (!res.success) return toast.warning(res.message);

    setStory(res.data);
  }

  async function fetchStoryReview() {
    if (!story) return;
    const res = await storyService.getReview(story?.id);

    if (!res.success) return toast.warning(res.message);

    setReview(res.data);
  }

  function handleNavigateStoryNode(storyNode: StoryNode[]) {
    if (storyNode[storyNode.length - 1].type !== "chapter") return;

    let routeDir = "";
    storyNode.forEach((node, i) => (routeDir = path.join(routeDir, `${node.type} ${node.order_index}`)));
    router.push(path.join(`/stories/${storyType}/${title}/`, routeDir));
  }

  function handleOpenRatingForm() {
    modal.open("custom", {
      content: <RatingInputForm onCancel={modal.close} onSubmit={modal.close} storyId={story?.id ?? ""}></RatingInputForm>,
    });
  }

  useEffect(() => {
    fetchStoryReview();
  }, [story]);

  useEffect(() => {
    fetchStory();
  }, []);

  return (
    <div className="flex flex-col gap-10 px-2.5">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* Story info */}
        <div className="lg:flex-1 flex flex-col gap-3 ">
          <StoryCardAllInfo className="bg-background-items shadow-[2px_2px_12px_4px_var(--foreground)]/25 " story={story}></StoryCardAllInfo>

          {/* Button */}
          <div className="grid grid-cols-2 md:grid-cols-4 justify-center items-center gap-2">
            <Button onClick={() => story?.children[0] && handleNavigateStoryNode([story?.children[0]])} className="w-full font-semibold">
              Đọc từ đầu
            </Button>
            <Button
              onClick={() => story?.children[0] && handleNavigateStoryNode([story?.children[story.children.length - 1]])}
              className="w-full font-semibold"
            >
              Đọc từ cuối
            </Button>
            {story?.history && (
              <Button onClick={() => story?.history && handleNavigateStoryNode([story?.history?.story_node])} className="w-full font-semibold">
                Đọc tiếp
              </Button>
            )}

            <ButtonOfFavouriteStory className="w-full h-full" story={story}></ButtonOfFavouriteStory>
          </div>
        </div>

        {/* Chapter list */}
        <StoryNodeList
          onClickItem={handleNavigateStoryNode}
          className="lg:flex-1 bg-background-items shadow-[2px_2px_12px_4px_var(--foreground)]/25 "
          storyNodes={story?.children}
          size={story?.number_of_children}
        ></StoryNodeList>
      </div>

      {/* Review */}
      <div
        className="flex flex-col border-2 border-foreground rounded-md px-5 py-2.5 gap-7 
          bg-background-items shadow-[2px_2px_12px_4px_var(--foreground)]/25 "
      >
        <h2 className="w-full text-center border-b-2 border-foreground font-semibold">Xem trước</h2>
        <div
          className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 
            gap-5"
        >
          {review?.map((url, i) => (
            <div key={i} className="border border-foreground/30 rounded-sm overflow-hidden">
              {url && <Image src={url} alt={`review ${i}`} width={400} height={800}></Image>}
            </div>
          ))}
        </div>
      </div>

      {/* Rating */}
      <RatingMasonryGrid storyId={story?.id ?? ""}></RatingMasonryGrid>

      {/* Comment */}
      <CommentMasonryGrid storyId={story?.id ?? ""}></CommentMasonryGrid>

      <RecommendStories className="max-w-[1800] mx-auto"></RecommendStories>
    </div>
  );
}
