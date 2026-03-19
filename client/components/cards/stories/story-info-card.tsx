import NewestChapter from "@/types/newest-chapter";
import Story from "@/types/story";

import { capitalizeFirstChar, capitalizeWords } from "@/utils/string";
import StoryStatusTag from "@/components/tags/story-status-tag";
import Tag from "@/components/tags/tag";
import GenreTag from "@/components/tags/genre-tag";
import { useEffect, useState } from "react";
import { convertNewestChapter } from "@/utils/convert";

interface StoryInfoCardProps {
  story?: Story;

  className?: string;
}

export default function StoryInfoCard({ story, className }: StoryInfoCardProps) {
  const labelClassName = "text-[1em] font-bold italic opacity-80";
  const subContainerClassName = "flex flex-row gap-1 justify-center items-center w-fit";

  const [newestChapter, setNewestChapter] = useState<NewestChapter[]>([]);

  useEffect(() => {
    setNewestChapter(convertNewestChapter(story?.newest_chapter ?? []));
  }, [story]);

  return (
    <div
      className={`flex flex-col bg-background border border-foreground/30 rounded-sm p-2.5
        w-[300px] lg:w-[400px] h-fit
        ${className}`}
    >
      {/* Title */}
      <p className="text-[1.8em] font-bold border-b border-foreground/30">
        [{capitalizeFirstChar(story?.type || "")}] {story?.title}
      </p>

      <div className="flex flex-col justify-center items-start gap-1 py-1 border-b border-foreground/30">
        {/* Status */}
        <div className={subContainerClassName}>
          <p className={labelClassName}>Tình trạng: </p>
          <StoryStatusTag status={story?.status}>{capitalizeFirstChar(story?.status || "")}</StoryStatusTag>
        </div>

        {/* Author */}
        <div className={subContainerClassName}>
          <p className={labelClassName}>Tác giả:</p>
          <div className="flex flex-row flex-wrap gap-1">
            {story?.author?.map((a, i) => (
              <p key={i}>{a.name} fds</p>
            ))}
          </div>
        </div>

        {/* Genre */}
        <div className={`flex flex-row flex-wrap gap-1`}>
          <p className={`${labelClassName} pr-2`}>Thể loại:</p>

          {story?.genres?.map((name, i) => (
            <GenreTag key={name} tagName={name}></GenreTag>
          ))}
        </div>
      </div>

      {/* Summary */}
      {story?.summary && (
        <div className="flex flex-col justify-center items-center gap-1 py-1 border-b border-foreground/30">
          <p className={labelClassName}>Tóm tắt</p>
          <p>{story?.summary}</p>
        </div>
      )}

      {/* Newest chapter */}
      {newestChapter && newestChapter.length > 0 && (
        <div className="flex flex-col justify-center items-start gap-1 py-1">
          <p className={labelClassName}>Chap mới nhất</p>
          <div className="flex flex-col justify-center items-start w-full gap-1">
            {newestChapter?.map((chapter, i) => (
              <div key={chapter.id} className="flex flex-row flex-wrap justify-between w-full cursor-pointer">
                <p>{chapter.dir}</p>
                <p className={labelClassName}>{chapter.dayPass} ngày trước</p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
