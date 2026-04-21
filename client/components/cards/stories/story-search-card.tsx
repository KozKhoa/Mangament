import Link from "@/components/link/Link";

import Story from "@/types/story";

import EyeIcon from "@/public/eye/open.svg";
import StarIcon from "@/public/star.svg";

import { snakeCaseToCapitalizeWord } from "@/utils/string";
import { beautifulView } from "@/utils/beautiful";
import Image from "next/image";

export default function StorySearchCard({ story, className }: { story: Story; className?: string }) {
  return (
    <Link
      href={`/stories/${story.type}/${story.id}`}
      className={`flex flex-row justify-start items-center bg-background text-foreground gap-2 p-1 rounded-sm
        border-transparent border transition-all duration-50 ease-linear  h-24
        hover:bg-hover-background w-full cursor-pointer
        ${className} `}
    >
      <div className={`relative aspect-2/3 rounded-sm h-full`}>
        {/* Cover art */}
        <Image src={story?.cover_art?.url ?? ""} alt="Cover Art" width={100} height={100}></Image>
      </div>

      <div className="flex flex-col gap-1 w-full h-full">
        <div className="text-[1.1em] text-start font-bold leading-tight line-clamp-2">
          {story.nation && (
            <span className="inline-block mr-1.5 align-middle">
              {story.nation.flag_image?.url ? (
                <Image src={story.nation.flag_image.url} alt={story.nation.name} width={20} height={14} className="object-contain inline-block"></Image>
              ) : (
                <span className="text-[1.2rem]">{story.nation.flag_icon}</span>
              )}
            </span>
          )}
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
    </Link>
  );
}
