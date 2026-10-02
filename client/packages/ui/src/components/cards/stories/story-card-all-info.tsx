import Story from "@/types/story";

import { beautifulView } from "@/utils/beautiful";
import { capitalizeFirstChar, snakeCaseToCapitalizeWord } from "@/utils/string";

import DisplayStar from "@/components/displays/ratings/display-star";
import StoryStatusTag from "@/components/tags/story-status-tag";
import Tag from "@/components/tags/tag";
import Loading from "@/components/loadings/loading";
import Line from "@/components/lines/line";
import GenreTag from "@/components/tags/genre-tag";
import Image from "next/image";
import imageUrlResole from "@/utils/imageUrlResole";

interface StoryCardAllInfoProps {
  story?: Story;
  className?: string;
}

const subLabelStyle = "font-bold italic opacity-75";
const labelContainerStyle = "flex flex-row flex-wrap justify-start items-start gap-x-3 gap-y-1";

export default function StoryCardAllInfo({ story, className }: StoryCardAllInfoProps) {
  return (
    <div
      className={`flex justify-center items-center bg-background text-foreground p-3 rounded-xl
        border-foreground/30 border w-full h-fit 
        ${className}`}
    >
      {!story ? (
        <Loading className="w-full h-64" />
      ) : (
        <div
          className="grid grid-cols-1 grid-rows-[auto_auto_auto]
            sm:grid-cols-2 sm:grid-rows-[auto_auto] 
            justify-center items-start gap-4 h-fit w-full"
        >
          {/* Cover art with Flag & Type overlays */}
          <div className="relative w-full max-w-125 md:row-span-2 flex justify-center m-auto rounded-lg overflow-hidden border border-foreground/10 shadow-md">
            <Image
              className="object-cover rounded-lg w-full h-auto"
              src={imageUrlResole(story.cover_art, "/blur-image.png")}
              alt={story.title || "Cover Art"}
              width={500}
              height={500}
              priority
            />

            {/* National flag overlaid on top-left corner */}
            {story?.nation && (
              <div
                className="absolute top-2.5 left-2.5 z-10 bg-black/65 backdrop-blur-md px-1.5 py-0.5 rounded-md shadow-md flex items-center justify-center border border-white/10"
                title={story.nation.name}
              >
                {story.nation.flag_image?.path ? (
                  <Image src={imageUrlResole(story.nation.flag_image)} alt={story.nation.name} width={24} height={16} className="object-contain rounded-xs" />
                ) : (
                  <span className="text-base leading-none">{story.nation.flag_icon}</span>
                )}
              </div>
            )}

            {/* Story type badge on bottom-center of cover art */}
            {story?.type && (
              <div
                className="absolute bottom-2.5 left-1/2 -translate-x-1/2 z-10 bg-black/75 backdrop-blur-md px-4 py-1 rounded-full
                 text-white font-bold uppercase tracking-wider border border-white/10 whitespace-nowrap shadow-[0px_1px_2px_rgba(255,255,255,0.6)]"
              >
                {snakeCaseToCapitalizeWord(story.type)}
              </div>
            )}
          </div>

          <div className="flex flex-col gap-2 justify-start items-start">
            {/* Title */}
            <h1 className="text-xl md:text-2xl font-bold leading-tight text-foreground">{story?.title}</h1>

            <Line />

            <div className="flex flex-col gap-2.5 w-full">
              {/* Rating */}
              <div className="flex flex-wrap gap-x-2.5 justify-start items-center">
                <div className={labelContainerStyle}>
                  <p className={subLabelStyle}>Đánh giá:</p>
                  <div className="flex justify-center items-center gap-2">
                    <DisplayStar rating={story?.star || 0} />
                    <p>{Math.round((story?.star ?? 0) * 10) / 10}</p>
                  </div>
                </div>
              </div>

              {/* View */}
              <div className={labelContainerStyle}>
                <p className={subLabelStyle}>Lượt xem:</p>
                <p className="text-[1em]">{beautifulView(story?.view || 0)}</p>
              </div>

              {/* Status */}
              <div className={labelContainerStyle}>
                <p className={subLabelStyle}>Tình trạng:</p>
                <StoryStatusTag status={story?.status}>{capitalizeFirstChar(story?.status || "")}</StoryStatusTag>
              </div>

              {/* Author */}
              <div className={labelContainerStyle}>
                <p className={subLabelStyle}>Tác giả:</p>
                {story?.author?.map((a, i) => (
                  <p key={i}>
                    {a.name}
                    {story.author?.length && i === story.author?.length - 1 ? "" : ","}
                  </p>
                ))}
              </div>

              {/* Genre */}
              <div className="flex flex-row flex-wrap gap-1">
                <p className={`${subLabelStyle} pr-2`}>Thể loại:</p>
                {story?.genres?.map((name) => (
                  <GenreTag key={name} tagName={name} />
                ))}
              </div>

              {/* Other titles */}
              {story?.other_titles && story.other_titles.length > 0 && (
                <div className={labelContainerStyle}>
                  <p className={subLabelStyle}>Tên khác:</p>
                  <div className="flex flex-row flex-wrap gap-1">
                    {story.other_titles.map((title, i) => (
                      <Tag key={i} className="px-2">
                        {title}
                      </Tag>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Summary */}
          <div
            className="p-2 w-full flex flex-col items-center gap-1 
              border-t border-foreground/10
              col-span-1 sm:col-span-2 md:col-span-1 lg:col-span-2 xl:col-span-1"
          >
            <p className={subLabelStyle}>Tóm tắt</p>
            <p className="text-sm text-foreground/80 leading-relaxed text-center sm:text-left w-full">{story?.summary}</p>
          </div>
        </div>
      )}
    </div>
  );
}
