import Story from "@/types/story";

import { beautifulView } from "@/utils/beautiful";
import { capitalizeWords, capitalizeFirstChar, snakeCaseToCapitalizeWord } from "@/utils/string";

import DisplayStar from "@/components/displays/ratings/display-star";
import StoryStatusTag from "@/components/tags/story-status-tag";
import Tag from "@/components/tags/tag";
import Loading from "@/components/loadings/loading";
import Line from "@/components/lines/line";
import GenreTag from "@/components/tags/genre-tag";
import Image from "next/image";

interface StoryCardAllInfoProps {
  story?: Story;
  className?: string;
}

const subLabelStyle = "font-bold italic opacity-75";
const labelContainerStyle = "flex flex-row flex-wrap justify-start items-start gap-x-3 gap-y-1";

export default function StoryCardAllInfo({ story, className }: StoryCardAllInfoProps) {
  return (
    <div
      className={` flex bg-background   text-foreground p-1.5 rounded-[5]
        border-foreground border-2 w-full h-fit 
        ${className} `}
    >
      {!story ? (
        <Loading className="w-full h-64"></Loading>
      ) : (
        <div
          className="grid grid-cols-1 grid-rows-[auto_auto_auto]
            sm:grid-cols-2 sm:grid-rows-[auto_auto] 
            justify-center items-start
            gap-2.5 h-fit w-fit"
        >
          {/* Cover art */}
          <div className="w-full min-w-[100] md:row-span-2 flex justify-center">
            <Image
              className="object-cover rounded-[5]"
              src={story?.cover_art?.url.includes("https") ? story?.cover_art?.url : process.env.NEXT_PUBLIC_API_URL + "uploads/story/" + story?.cover_art?.url}
              alt="Cover Art"
              width={500}
              height={500}
            ></Image>
          </div>

          <div className="flex flex-col gap-1 justify-start items-start">
            {/* Tittle */}
            <h2 className="font-bold leading-tight cursor-pointer">{"[" + capitalizeFirstChar(story?.type || "") + "] " + story?.title}</h2>

            <Line></Line>

            <div className="flex flex-col gap-2">
              {/* Rating */}
              <div className="flex flex-wrap gap-x-2.5 justify-start items-center">
                <div className={labelContainerStyle}>
                  <p className={subLabelStyle}>Đánh giá:</p>
                  <div className="flex justify-center items-center gap-2">
                    <DisplayStar className="" rating={story?.star || 0}></DisplayStar>
                    <p className="">{Math.round((story?.star ?? 0) * 10) / 10}</p>
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
                    {a.name} {story.author?.length && i === story.author?.length - 1 ? "" : ","}
                  </p>
                ))}
              </div>

              {/* Genre */}
              <div className={`flex flex-row flex-wrap gap-1 `}>
                <p className={`${subLabelStyle} pr-2`}>Thể loại:</p>

                {story?.genres?.map((name, i) => (
                  <GenreTag key={name} tagName={name}></GenreTag>
                ))}
              </div>

              <div className="flex flex-col justify-between gap-1 w-full 2 "></div>
            </div>
          </div>

          {/* Summary */}
          <div
            className="p-1 w-full flex flex-col items-center gap-1 
              border-t
              col-span-1 sm:col-span-2 md:col-span-1 lg:col-span-2 xl:col-span-1
            "
          >
            <p className={subLabelStyle}>Tóm tắt</p>
            <p>{story?.summary}</p>
          </div>
        </div>
      )}
    </div>
  );
}
