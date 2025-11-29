import NewestChapter from "@/types/newest-chapter";
import Story from "@/types/story";

import { capitalizeFirstChar, capitalizeWords } from "@/utils/string";
import StatusTag from "@/components/tags/status-tag";
import Tag from "@/components/tags/tag";

interface StoryInfoCardProps {
  story?: Story;
  newestChapter?: NewestChapter[];
  className?: string;
}

export default function StoryInfoCard({ story, newestChapter, className }: StoryInfoCardProps) {
  const labelClassName = "text-[1em] font-bold italic";
  const subContainerClassName = "flex flex-row gap-1 justify-center items-center w-fit";

  return (
    <div
      className={`flex flex-col   bg-background border-2 rounded-[5] p-2.5
        w-lg h-fit
        ${className}`}
    >
      {/* Title */}
      <p className="text-[1.8em] font-bold  border-b ">
        [{capitalizeFirstChar(story?.type || "")}] {story?.title}
      </p>

      <div className="flex flex-col justify-center items-start gap-1 py-1 border-b">
        {/* Status */}
        <div className={subContainerClassName}>
          <p className={labelClassName}>Tình trạng: </p>
          <StatusTag status={story?.status}>{capitalizeFirstChar(story?.status || "")}</StatusTag>
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
        <div className={`${subContainerClassName}`}>
          <p className={`${labelClassName} `}>Thể loại:</p>
          <div className="flex flex-row flex-wrap gap-1">
            {story?.genre?.map((name, i) => (
              <Tag key={i}>#{capitalizeWords(name)}</Tag>
            ))}
          </div>
        </div>
      </div>

      {/* Summary */}
      {story?.summary && (
        <div className="flex flex-col justify-center items-center gap-1 py-1 border-b">
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
