import Image from "next/image";
import { useRouter } from "next/navigation";

import Story from "@/models/story";
import StoryNode from "@/models/story-node";
import { capitalizeFirstChar } from "@/utils/string";
import { useEffect, useRef, useState } from "react";
import { diffDate } from "@/utils/date";

import EyeIcon from "@/public/eye/open.svg";
import StarIcon from "@/public/star.svg";
import { beautifulView } from "@/utils/beautiful";
import StarForRating from "@/components/ratings/start-rating";
import NewestChapter from "@/models/newest-chapter";

interface StoryCardProps {
  story: Story;
  newestChapter?: NewestChapter;
  className?: string;
}

function StoryCard({ story, newestChapter, className }: StoryCardProps) {
  const router = useRouter();
  // const newestChapter = useRef<string[]>([]);
  // const newestChapterDate = useRef<Date[]>([]);

  // const [title, setTitle] = useState<string>("");

  // useEffect(() => {
  //   if (!story.newestChapter) return;

  //   const getNewestChapter = (storyNode: StoryNode, parent: string) => {
  //     if (!storyNode) return "";

  //     const node =
  //       capitalizeFirstChar(storyNode.type) + " " + storyNode.orderIndex;

  //     if (storyNode.type === "chapter") {
  //       newestChapter?.current?.push(parent + node);
  //       newestChapterDate.current.push(storyNode.createAt);

  //       return;
  //     }

  //     if (storyNode.children) {
  //       for (const child of storyNode.children) {
  //         getNewestChapter(child, parent + node + "/");
  //       }
  //     }
  //   };

  //   for (const node of story.newestChapter) {
  //     getNewestChapter(node, "");
  //   }

  //   console.log(newestChapter.current);

  //   setTitle(story.title);
  // }, []);

  const handleClickStory = () => {
    router.push(`/story/${story.id}`);
  };

  const handleClickNewestChapter = () => {
    // router.push(`/story-node/${newestChapter.current.at(0)}`);
  };

  return (
    <div
      className={`flex flex-col justify-center items-center relative bg-background font-afacad text-foreground  gap-2.5 p-2.5 rounded-[5]
        border-transparent border-2 transition-all duration-50 ease-linear
        hover:shadow-[5px_6px_5px_rgba(0,0,0,0.3)] hover:border-foreground
        max-w-sm w-fit
        ${className}
    `}
    >
      <div
        onClick={() => handleClickStory()}
        className={`relative aspect-2/3 rounded-[5] w-full cursor-pointer
          w-[${story?.coverArt?.width}] h-[${story?.coverArt?.height}]`}
      >
        {/* Cover art */}
        <Image
          className="object-cover rounded-[5]"
          src={"/frieren-vertical.png"}
          alt="Cover Art"
          fill
        ></Image>

        {/* View */}
        <div
          className="flex flex-row justify-star items-center gap-x-1
          absolute right-0 bottom-0 px-1 bg-background rounded-tl-md"
        >
          <EyeIcon className="w-4 h-4"></EyeIcon>
          <p className="text-[0.9em] italic">
            {beautifulView(story?.view || 0)}
          </p>
        </div>
      </div>

      <div className="flex flex-col gap-1 w-fit">
        {/* Tittle */}
        <div
          onClick={() => handleClickStory()}
          className="text-[1.5em] font-bold leading-tight cursor-pointer"
        >
          {"[" + capitalizeFirstChar(story?.type) + "] " + story?.title}
        </div>

        {/* Rating */}
        <div className="flex  flex-wrap gap-x-2.5 justify-start items-center">
          <div className="flex  justify-center items-center gap-1">
            <div className="flex justify-center items-center">
              <StarForRating rating={story.star || 0}></StarForRating>
            </div>
            <p className="">{story?.star}</p>
          </div>
        </div>

        {/* Newest chapter */}
        <div className="flex flex-col justify-center items-start gap-x-2.5-2.5">
          <p className="text-[0.8em] italic font-bold">Chap mới nhất:</p>
          {story?.newestChapter && (
            <div
              onClick={() => handleClickNewestChapter()}
              className="flex flex-wrap items-center justify-between cursor-pointer gap-x-2"
            >
              <p>{newestChapter?.dir}</p>
              <p className="text-[0.8em] italic">
                {newestChapter?.dayPass} ngày trước
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default StoryCard;
