import Story from "@/types/story";

import { beautifulView } from "@/utils/beautiful";
import { capitalizeWords, capitalizeFirstChar, snakeCaseToCapitalizeWord } from "@/utils/string";

import DisplayStar from "@/components/displays/ratings/display-star";
import StatusTag from "@/components/tags/status-tag";
import Tag from "@/components/tags/tag";
import Loading from "@/components/loadings/loading";
import Line from "@/components/lines/line";

interface StoryCardAllInfoProps {
  story?: Story;
  className?: string;
}

const subLabelStyle = "font-bold italic";
const labelContainerStyle = "flex flex-row flex-wrap justify-start items-start gap-x-3 gap-y-1";

export default function StoryCardAllInfo({ story, className }: StoryCardAllInfoProps) {
  return (
    <div
      className={` flex bg-background   text-foreground p-1.5 rounded-[5]
        border-foreground border-2 w-full h-fit text-[1.2em]
        ${className} `}
    >
      {!story ? (
        <Loading className="w-full"></Loading>
      ) : (
        <div
          className="grid grid-cols-1 grid-rows-[auto_auto_auto]
            sm:grid-cols-2 sm:grid-rows-[auto_auto] 
            justify-center items-start
            gap-2.5 h-fit w-fit"
        >
          {/* Cover art */}
          <div className="w-full min-w-[100] md:row-span-2 flex justify-center">
            <img className="object-cover rounded-[5]" src={process.env.NEXT_PUBLIC_API_URL + "uploads/story/" + story?.cover_art?.url} alt="Cover Art"></img>
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
                    <DisplayStar rating={story?.star || 0}></DisplayStar>
                    <p className="">{story?.star}</p>
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
                <StatusTag status={story?.status}>{capitalizeFirstChar(story?.status || "")}</StatusTag>
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
              <div className={labelContainerStyle}>
                <p className={subLabelStyle}>Thể loại:</p>
                <div className="flex flex-row flex-wrap gap-2">
                  {story?.genre?.map((g, i) => (
                    <Tag key={i}># {snakeCaseToCapitalizeWord(g)}</Tag>
                  ))}
                </div>
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
