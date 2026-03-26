"use client";

import path from "path";
import { toast } from "sonner";
import { useParams } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";

import storyService from "@/services/story";

import Story from "@/types/story";
import StoryNode from "@/types/story-node";

import Button from "@/components/buttons/button";

import StoryNodeList from "@/components/list/story-node-list";
import RecommendStories from "@/components/list/recommend-story";
import StoryCardAllInfo from "@/components/cards/stories/story-card-all-info";
import ButtonOfFavouriteStory from "@/components/buttons/favourite-button";
import CommentMasonryGrid from "@/components/grids/comment-masonry-grid";
import RatingMasonryGrid from "@/components/grids/rating-masonry-grid";

import Image from "next/image";
import { loadingBar } from "@/components/loadings/loading-bar/top-loading-bar.store";
import ImageType from "@/types/image";

export default function StoryDetailPage() {
  const router = useRouter();
  const params = useParams();

  const storyType = useMemo(() => params.storyType?.toString(), [params]);
  const title = useMemo(() => params.title?.toString(), [params]);

  const [story, setStory] = useState<Story>();
  const [reviews, setReviews] = useState<ImageType[]>([]);

  async function fetchStory() {
    if (!title || !storyType) return;

    const res = await storyService.getStoryByTitle(title ?? "", { isGettingChildren: true, isGettingSummary: true, type: [storyType] });

    if (!res.success) return toast.warning(res.message);

    setStory(res.data);
  }

  async function fetchStoryReview() {
    if (!story) return;

    const res = await storyService.getReview(story?.id);

    if (!res.success) return toast.warning(res.message);

    setReviews(res.data ?? []);
  }

  function handleNavigateStoryNode(storyNode: StoryNode[]) {
    if (storyNode[storyNode.length - 1].type !== "chapter") return;

    loadingBar.open({});

    let routeDir = "";
    storyNode.forEach((node, i) => (routeDir = path.join(routeDir, `${node.type} ${node.order_index}`)));
    router.push(path.join(`/stories/${storyType}/${title}/`, routeDir));
  }

  useEffect(() => {
    fetchStoryReview();
  }, [story]);

  useEffect(() => {
    if (!title || !storyType || title == "undefined" || storyType == "undefined") return;

    fetchStory();

    loadingBar.close();
  }, [storyType, title]);

  return (
    <div className="flex flex-col gap-10 px-2.5">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* Story info */}
        <div className="lg:flex-1 flex flex-col gap-3 ">
          <StoryCardAllInfo className="bg-background-items shadow-lg" story={story} />

          {/* Button */}
          <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 justify-center items-center gap-2">
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
          className="lg:flex-1 bg-background-items"
          storyNodes={story?.children}
          size={story?.number_of_children}
        />
      </div>

      {/* Review */}
      <div
        className="flex flex-col border border-foreground/30 rounded-sm px-5 py-2.5 gap-7 
          bg-background-items shadow-lg"
      >
        <h2 className="w-full text-center border-b border-foreground/30 font-semibold">Xem trước</h2>
        <div
          className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 
            gap-5"
        >
          {reviews?.map((review, i) => (
            <div key={i} className="border border-foreground/30 rounded-sm overflow-hidden">
              {review && (
                <Image
                  src={[process.env.NEXT_PUBLIC_CDN_URL, review.key].join("/")}
                  alt={`review ${i}`}
                  width={300}
                  height={400}
                  style={{ width: "100%", height: "auto" }}
                ></Image>
              )}
            </div>
          ))}
        </div>
      </div>

      <div className="flex flex-col gap-5">
        {/* Rating */}
        <RatingMasonryGrid storyId={story?.id ?? ""} allowAddNewRating={story?.rating ? false : true}></RatingMasonryGrid>

        {/* Comment */}
        <CommentMasonryGrid storyId={story?.id ?? ""}></CommentMasonryGrid>
      </div>

      {story && <RecommendStories story={story} className="max-w-[1800] mx-auto" />}
    </div>
  );
}
