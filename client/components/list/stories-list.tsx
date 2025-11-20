import StoryCard from "@/components/cards/stories/story-card";

import Story from "@/types/story";

interface StoryListProps {
  stories?: Story[];

  label?: string;

  className?: string;
}

export default function StoryList({ label, stories, className }: StoryListProps) {
  return (
    <div className={` flex flex-col justify-center items-center gap-5 w-full ${className}`}>
      <h2 className="text-[2em] font-bold">{label}</h2>

      <div className="flex flex-row overflow-x-auto w-full">
        <div className="flex flex-row justify-center items-start gap-2">
          {stories?.map((story, i) => (
            <div key={story?.id} className="w-[150] md:w-[200] ">
              <StoryCard className="w-full" story={story}></StoryCard>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
