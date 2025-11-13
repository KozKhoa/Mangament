import ButtonGenre from "@/components/buttons/genre/genre";
import NewestChapter from "@/models/newest-chapter";
import Story from "@/models/story";
import { capitalizeFirstChar } from "@/utils/string";

interface StoryInfoCardProps {
  story: Story;
  newestChapter?: NewestChapter[];
  className?: string;
}

export default function StoryInfoCard({
  story,
  newestChapter,
  className,
}: StoryInfoCardProps) {
  const labelClassName = "text-[0.8em] font-bold italic";
  const subContainerClassName =
    "flex flex-row gap-1 justify-center items-center w-fit";

  return (
    <div
      className={`font-afacad bg-background border-2 rounded-[5] p-2.5
        max-w-xs
        ${className}`}
    >
      {/* Title */}
      <p className="text-[1.8em] font-bold  border-b ">
        [{capitalizeFirstChar(story.type)}] {story.title}
      </p>

      <div className="flex flex-col justify-center items-start gap-1 py-1 border-b">
        {/* Status */}
        <div className={subContainerClassName}>
          <p className={labelClassName}>Tình trạng: </p>
          <p>{capitalizeFirstChar(story.status)}</p>
        </div>

        {/* Author */}
        <div className={subContainerClassName}>
          <p className={labelClassName}>Tác giả:</p>
          <div className="flex flex-row flex-wrap gap-1">
            {story.author?.map((name, i) => (
              <p key={i}>
                {name}
                {i < (story.author?.length ?? 0) - 1 ? ", " : ""}
              </p>
            ))}
          </div>
        </div>

        {/* Genre */}
        <div className={`${subContainerClassName}`}>
          <p className={`${labelClassName} `}>Thể loại:</p>
          <div className="flex flex-row flex-wrap gap-1">
            {story.genre?.map((name, i) => (
              <ButtonGenre key={i}>{name}</ButtonGenre>
            ))}
          </div>
        </div>
      </div>

      {/* Summary */}
      <div className="flex flex-col justify-center items-center gap-1 py-1 border-b">
        <p className={labelClassName}>Tóm tắt</p>
        <p>{story.summary}</p>
      </div>

      {/* Newest chapter */}
      <div className="flex flex-col justify-center items-start gap-1 py-1">
        <p className={labelClassName}>Chap mới nhất</p>
        <div className="flex flex-col justify-center items-start w-full gap-1">
          {newestChapter?.map((chapter, i) => (
            <div
              key={i}
              className="flex flex-row flex-wrap justify-between w-full cursor-pointer"
            >
              <p>{chapter.dir}</p>
              <p className={labelClassName}>{chapter.dayPass} ngày trước</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
