import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { toast } from "sonner";

import Story from "@/types/story";
import NewestChapter from "@/types/newest-chapter";

import EyeIcon from "@/public/eye/open.svg";
import HeartIcon from "@/public/heart.svg";

import { beautifulView } from "@/utils/beautiful";
import { snakeCaseToCapitalizeWord } from "@/utils/string";

import DisplayStar from "@/components/displays/ratings/display-star";

import useAuth from "@/contexts/AuthContext";

import favouriteService from "@/services/favourite";
import { convertNewestChapter } from "@/utils/convert";

interface StoryCardProps {
  data: Story;
  className?: string;
}

export default function StoryCard({ data, className }: StoryCardProps) {
  const auth = useAuth();
  const user = auth?.user;
  const router = useRouter();
  const story = data;

  const [favouriteId, setFavouriteId] = useState<string | null>(story.favourite?.id ?? null);
  const [newestChapter, setNewestChapter] = useState<NewestChapter[]>([]);

  const handleClickFavourite = () => {
    const saveFavourite = async () => {
      const res = await favouriteService.addNewFavouriteStory(story.id);

      if (!res.success) return toast.warning(res.message);

      setFavouriteId(res.data?.id ?? null);

      toast.message(`Added successfully`);
    };

    const removeFavourite = async () => {
      const res = await favouriteService.removeFavouriteStory(favouriteId ?? ""); // Error: id must be favourite id

      if (!res.success) return toast.warning(res.message);

      setFavouriteId(null);

      toast.message(`Removed successfully`);
    };

    if (!user) {
      return toast.warning("Please login to add to favourite ");
    } else if (!favouriteId) {
      saveFavourite();
    } else if (favouriteId) {
      removeFavourite();
    }
  };

  const handleClickStory = () => {
    router.push(`/stories/${story.type}/${story.title}`);
  };

  const handleClickNewestChapter = () => {
    router.push(`/stories/${story.type}/${story.title}/chapter/${newestChapter.at(0)?.orderIndex}/${newestChapter.at(0)?.id}`);
  };

  useEffect(() => {
    setNewestChapter(convertNewestChapter(story?.newest_chapter || [], 1));
  }, [story]);

  return (
    <div
      className={`flex flex-col text-foreground gap-2.5 p-1.5 rounded-[5]
        border-transparent border-2 transition-all duration-50 ease-linear
        shadow-md max-w-sm w-full h-full bg-background-items
        ${className} `}
    >
      <div className={`relative rounded-[5] w-full h-fit cursor-pointer`}>
        {/* Cover art */}
        <img
          onClick={() => handleClickStory()}
          className="h-full aspect-2/3 rounded-[5]"
          src={process.env.NEXT_PUBLIC_API_URL + "uploads/story/" + story?.cover_art?.url}
          alt="Cover Art"
        ></img>

        {/* View */}
        <div
          className="flex flex-row justify-star items-center gap-x-1
          absolute right-0 bottom-0 px-1 rounded-tl-md bg-background-items"
        >
          <EyeIcon className="w-5 h-5"></EyeIcon>
          <p className="italic font-semibold text-[0.8em]">{beautifulView(story?.view || 0)}</p>
        </div>

        {/* Save favourite */}
        <button className=" absolute top-0 right-0 rounded-b-4xl bg-background-items" onClick={() => handleClickFavourite()}>
          <HeartIcon className={`w-8 h-8 stroke-1 ${favouriteId ? " fill-red-400 text-red-400" : " fill-background-items text-foreground"}`}></HeartIcon>
        </button>
      </div>

      <div className="flex flex-col gap-1 w-full h-full">
        {/* Tittle */}
        <div onClick={() => handleClickStory()} className="text-[1.2em] text-start font-bold leading-tight cursor-pointer line-clamp-2">
          {"[" + snakeCaseToCapitalizeWord(story?.type ?? "") + "] " + story?.title}
        </div>

        {/* Rating */}
        <div className="flex flex-wrap gap-x-2.5 justify-start items-center">
          <div className="flex  justify-center items-center gap-1">
            <div className="flex justify-center items-center">
              <DisplayStar rating={story?.star || 0}></DisplayStar>
            </div>
            <p>{story?.star}</p>
          </div>
        </div>

        {/* Newest chapter */}
        {newestChapter && newestChapter.length > 0 && (
          <div className="flex flex-col justify-center items-start gap-x-2.5-2.5 opacity-90">
            <p className="text-[0.8em] italic ">Chap mới nhất:</p>

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
