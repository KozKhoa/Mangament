import Story from "@/types/story";
import { snakeCaseToCapitalizeWord } from "@/utils/string";
import { useRouter } from "next/navigation";

export default function SimpleStoryCard({ story, className }: { story: Story; className?: string }) {
  const router = useRouter();
  const handleClickStory = () => {
    router.push(`/stories/${story.type}/${story.title}`);
  };
  return (
    <div
      className={`flex flex-col justify-start items-center bg-background text-foreground gap-1.5 p-1.5 rounded-[5]
        border-transparent border-2 transition-all duration-50 ease-linear
        shadow-md
        hover:shadow-[6px_8px_5px_0px_rgba(0,0,0,0.3)] hover:border-foreground
        max-w-sm w-full h-full
        ${className} `}
    >
      <div className={`relative rounded-[5] w-full cursor-pointer`}>
        {/* Cover art */}
        <img
          onClick={() => handleClickStory()}
          className="object-cover rounded-[5]"
          src={process.env.NEXT_PUBLIC_API_URL + "uploads/story/" + story?.cover_art?.url}
          alt="Cover Art"
        ></img>
      </div>

      <div className="flex flex-col gap-1 w-full h-full">
        {/* Tittle */}
        <div onClick={() => handleClickStory()} className="text-[1.2em] text-start font-semibold leading-tight cursor-pointer">
          {"[" + snakeCaseToCapitalizeWord(story?.type ?? "") + "] " + story?.title}
        </div>
      </div>
    </div>
  );
}
