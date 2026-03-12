import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";

import Story from "@/types/story";

import useAuth from "@/contexts/AuthContext";

import EyeIcon from "@/public/eye/open.svg";
import HeartIcon from "@/public/heart.svg";

import favouriteService from "@/services/favourite";

import { snakeCaseToCapitalizeWord } from "@/utils/string";
import { beautifulView } from "@/utils/beautiful";

import GenreTag from "@/components/tags/genre-tag";
import Image from "next/image";

export default function StoryGenreCard({ story, className }: { story: Story; className?: string }) {
  const auth = useAuth();
  const user = auth?.user;

  const router = useRouter();

  const [favouriteId, setFavouriteId] = useState<string | null>(story.favourite?.id ?? null);

  const saveFavourite = useCallback(async () => {
    const res = await favouriteService.addNewFavouriteStory(story.id);

    if (!res) return toast.warning("Cannot connect with server");
    if (!res.success) return toast.warning(res.message);

    setFavouriteId(res.data?.id ?? null);

    toast.message(`Added successfully`);
  }, [story.id]);

  const removeFavourite = useCallback(async () => {
    const res = await favouriteService.removeFavouriteStory(favouriteId ?? ""); // Error: id must be favourite id

    if (!res) return toast.warning("Cannot connect with server");
    if (!res.success) return toast.warning(res.message);

    setFavouriteId(null);

    toast.message(`Removed successfully`);
  }, [favouriteId]);

  const handleClickFavourite = useCallback(() => {
    if (!user) return toast.warning("Please login to add to favourite");

    favouriteId ? removeFavourite() : saveFavourite();
  }, [user, favouriteId, story.id, saveFavourite, removeFavourite]);

  const handleClickStory = useCallback(() => {
    router.push(`/stories/${story.type}/${story.title}`);
  }, [router, story.title, story.type]);

  useEffect(() => {
    setFavouriteId(story.favourite?.id ?? null);
  }, [story.favourite?.id]);

  return (
    <div
      className={`flex flex-col bg-background-items text-foreground gap-1 p-1.5 rounded-[5] border-transparent 
        transition-all duration-100 ease-in-out shadow-lg max-w-sm w-full h-full
        ${className} `}
    >
      <div className={`relative rounded-[5] w-full h-fit cursor-pointer`}>
        {/* Cover art */}
        <Image
          className="aspect-7/10 object-contain rounded-sm overflow-hidden m-auto"
          onClick={handleClickStory}
          src={story?.cover_art?.url ?? ""}
          alt="Cover Art"
          width={200}
          height={300}
        ></Image>

        {/* View */}
        <div
          className="flex flex-row justify-star items-center gap-x-1
          absolute right-0 bottom-0 px-1 bg-background-items rounded-tl-md"
        >
          <EyeIcon className="w-5 h-5"></EyeIcon>
          <p className="italic font-semibold text-[0.8em]">{beautifulView(story?.view || 0)}</p>
        </div>

        {/* Save favourite */}
        <button className=" absolute top-0 right-0 bg-background-items rounded-b-4xl" onClick={handleClickFavourite}>
          <HeartIcon className={`w-8 h-8  stroke-1 ${favouriteId ? " fill-red-400 text-red-400" : " fill-background-items text-foreground"}`}></HeartIcon>
        </button>
      </div>

      <div className="flex flex-col gap-1 w-full h-full">
        {/* Tittle */}
        <div onClick={handleClickStory} className="text-[1.2em] text-start font-bold leading-tight cursor-pointer">
          {"[" + snakeCaseToCapitalizeWord(story?.type ?? "") + "] " + story?.title}
        </div>

        {/* Genre */}
        <div
          style={{
            maxHeight: 3 * 32 + "px",
          }}
          className={`flex flex-wrap justify-start gap-x-1 gap-y-1 overflow-hidden`}
        >
          {story && story.genres?.map((g, i) => <GenreTag tagName={g} className="w-fit text-[0.8em]" key={g}></GenreTag>)}
        </div>
      </div>
    </div>
  );
}
