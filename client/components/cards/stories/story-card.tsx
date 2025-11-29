import { useRouter } from "next/navigation";
import { useRef, useState } from "react";
import { toast } from "sonner";

import Story from "@/types/story";
import NewestChapter from "@/types/newest-chapter";

import EyeIcon from "@/public/eye/open.svg";
import HeartIcon from "@/public/heart.svg";

import { beautifulView } from "@/utils/beautiful";
import { capitalizeFirstChar } from "@/utils/string";

import DisplayStar from "@/components/displays/ratings/display-star";

import useAuth from "@/contexts/AuthContext";

import favouriteService from "@/services/user/favourite";

interface StoryCardProps {
  story: Story;
  newestChapter?: NewestChapter[];
  className?: string;
}

export default function StoryCard({ story, newestChapter, className }: StoryCardProps) {
  const auth = useAuth();
  const user = auth?.user;
  const router = useRouter();

  const [isInFavourite, setIsInFavourite] = useState<boolean>(!story.favourite ? false : true);

  const handleClickFavourite = () => {
    const saveFavourite = async () => {
      const res = await favouriteService.post({ storyId: story.id });
      if (res.success) {
        setIsInFavourite(true);
        story.favourite = res.data.favourite;

        toast.message(`Added successfully`);
      } else {
        toast.warning(res.message);
      }
    };

    const removeFavourite = async () => {
      const res = await favouriteService.remove(story?.favourite?.id || ""); // Error: id must be favourite id

      if (res.success) {
        setIsInFavourite(false);
        story.favourite = undefined;
        toast.message(`Removed successfully`);
      } else {
        toast.warning(res.message);
      }
    };

    if (!user) {
      return toast.warning("Please login to add to favourite ");
    } else if (!isInFavourite) {
      saveFavourite();
    } else if (isInFavourite) {
      removeFavourite();
    }
  };

  const handleClickStory = () => {
    router.push(`/story/${story.type}/${story.id}`);
  };

  const handleClickNewestChapter = () => {
    // router.push(`/story-node/${newestChapter.current.at(0)}`);
    // Todo: thêm điều hướng tới trang đọc chapter
  };

  return (
    <div
      className={`flex flex-col justify-start items-center bg-background   text-foreground gap-2.5 p-1.5 rounded-[5]
        border-transparent border-2 transition-all duration-50 ease-linear
        hover:shadow-[6px_8px_5px_0px_rgba(0,0,0,0.3)] hover:border-foreground
        max-w-sm w-full h-full
        ${className} `}
    >
      <div
        className={`relative aspect-2/3 rounded-[5] w-full cursor-pointer
          w-[${story?.cover_art?.width}] h-[${story?.cover_art?.height}]`}
      >
        {/* Cover art */}
        <img
          onClick={() => handleClickStory()}
          className="object-cover rounded-[5]"
          src={process.env.NEXT_PUBLIC_API_URL + "uploads/story/" + story.cover_art?.url}
          alt="Cover Art"
        ></img>

        {/* View */}
        <div
          className="flex flex-row justify-star items-center gap-x-1
          absolute right-0 bottom-0 px-1 bg-background rounded-tl-md"
        >
          <EyeIcon className="w-4 h-4"></EyeIcon>
          <p className="text-[1em] italic">{beautifulView(story?.view || 0)}</p>
        </div>

        {/* Save favourite */}
        <button className=" absolute top-0 right-0 bg-background rounded-b-4xl" onClick={() => handleClickFavourite()}>
          <HeartIcon className={`w-8 h-8  stroke-1 ${isInFavourite ? " fill-red-400 text-red-400" : " fill-background text-foreground"}`}></HeartIcon>
        </button>
      </div>

      <div className="flex flex-col justify-between gap-1 w-full">
        {/* Tittle */}
        <div onClick={() => handleClickStory()} className="text-[1.5em] font-bold leading-tight cursor-pointer">
          {"[" + capitalizeFirstChar(story?.type) + "] " + story?.title}
        </div>

        {/* Rating */}
        <div className="flex flex-wrap gap-x-2.5 justify-start items-center">
          <div className="flex  justify-center items-center gap-1">
            <div className="flex justify-center items-center">
              <DisplayStar rating={story.star || 0}></DisplayStar>
            </div>
            <p className="">{story?.star}</p>
          </div>
        </div>

        {/* Newest chapter */}
        {newestChapter && newestChapter.length > 0 && (
          <div className="flex flex-col justify-center items-start gap-x-2.5-2.5">
            <p className="text-[0.8em] italic font-bold">Chap mới nhất:</p>

            <div onClick={() => handleClickNewestChapter()} className="flex flex-wrap items-center justify-between cursor-pointer gap-x-2">
              <p>{newestChapter?.[0].dir}</p>
              <p className="text-[0.8em] italic">{newestChapter?.[0].dayPass} ngày trước</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
