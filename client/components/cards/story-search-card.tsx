import { useRouter } from "next/navigation";

import Story from "@/types/story";

import DisplayStar from "../displays/ratings/display-star";

import EyeIcon from "@/public/eye/open.svg";
import StarIcon from "@/public/star.svg";

import { snakeCaseToCapitalizeWord, snakeCaseToNormal } from "@/utils/string";
import { beautifulView } from "@/utils/beautiful";

export default function StorySearchCard({ story, className, ref }: { story: Story; className?: string; ref?: React.Ref<HTMLDivElement> }) {
  const router = useRouter();

  const handleClickStory = () => {
    router.push(`/story/${story.type}/${story.id}`);
  };

  return (
    <div
      ref={ref}
      onClick={() => handleClickStory()}
      className={`flex flex-row justify-start items-center bg-background text-foreground gap-2 p-1 rounded-[5]
        border-transparent border-2 transition-all duration-50 ease-linear  h-24
        hover:bg-hover-background w-full cursor-pointer
        ${className} `}
    >
      <div className={`relative aspect-2/3 rounded-[5] h-full`}>
        {/* Cover art */}
        <img className="object-cover rounded-[5]" src={process.env.NEXT_PUBLIC_API_URL + "uploads/story/" + story?.cover_art?.url} alt="Cover Art"></img>
      </div>

      <div className="flex flex-col gap-1 w-full h-full">
        {/* Tittle */}
        <div className="text-[1.1em] text-start font-bold leading-tight line-clamp-2">
          {"[" + snakeCaseToCapitalizeWord(story?.type ?? "") + "] " + story?.title}
        </div>

        <div className="flex flex-wrap gap-x-1 justify-start items-center">
          {/* View */}
          <div
            className="flex flex-row justify-star items-center gap-x-1
            px-1 rounded-tl-md"
          >
            <EyeIcon className="w-4 h-4"></EyeIcon>
            <p>{beautifulView(story?.view || 0)}</p>
          </div>

          {/* Rating */}
          <div className="flex  justify-center items-center gap-1">
            <div className="flex justify-center items-center">
              <StarIcon className="w-4 h-4 fill-amber-400"></StarIcon>
            </div>
            <p className="">{story?.star}</p>
          </div>
        </div>
      </div>
    </div>
  );
}
