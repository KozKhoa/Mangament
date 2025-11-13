import Story from "@/models/story";

import * as StoryCardVertical from "@/components/cards/stories/story-card-vertical";

import * as StoryCardHorizontal from "@/components/cards/stories/story-card-horizontal";
import NewestChapter from "@/models/newest-chapter";

interface StoryCardProps {
  story: Story;
  newestChapter?: NewestChapter;
  className?: string;
}

export default function StoryCard({
  story,
  newestChapter,
  className,
}: StoryCardProps) {
  return (
    <>
      <StoryCardVertical.default
        story={story}
        newestChapter={newestChapter}
        className={`flex lg:hidden ${className}`}
      ></StoryCardVertical.default>

      <StoryCardHorizontal.default
        story={story}
        newestChapter={newestChapter}
        className={`hidden lg:flex ${className}`}
      ></StoryCardHorizontal.default>
    </>
  );
}
