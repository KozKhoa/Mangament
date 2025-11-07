import Link from "next/link";
import Image from "next/image";

import StartIcon from "@/public/star.svg";

interface StoryNode {
  type: string;
  number: number;
  timeLeft: string;
}

interface CoverArt {
  url: string;
  width?: number;
  height?: number;
}

interface Props {
  link: string;
  coverArt?: CoverArt;
  title: string;
  star?: number;
  view?: number;
  newestStoryNode?: StoryNode;

  storyId?: string;
  className?: string;
}

function StoryHorizontalNavigation({
  link,
  coverArt,
  title,
  star = 4,
  view = 0,
  newestStoryNode = { type: "Chapter", number: 123, timeLeft: "12 ngày trước" },

  storyId,
  className,
}: Props) {
  return (
    <Link
      href={link}
      className={`relative bg-background font-afacad text-foreground flex flex-row flex-wrap gap-2.5 p-2.5 rounded-[5] 
        border-transparent border-2 transition-all duration-50 ease-linear
        hover:shadow-[5px_6px_5px_rgba(0,0,0,0.3)] hover:border-foreground 
        max-w-sm
        ${className}        
    `}
    >
      <div
        className={`relative flex-1 rounded-[5] not-first:overflow-hidden w-full h-auto w-[${coverArt?.width}] h-[${coverArt?.height}]`}
      >
        <Image
          className="object-contain"
          src={coverArt?.url || "/frieren-vertical.png"}
          alt="Cover Art"
          fill
          // width={100}
          // height={100}
        ></Image>
      </div>
      <div className="flex flex-col flex-1 gap-2.5">
        <p className="text-[1.5em] font-bold leading-tight">{title}</p>
        <div className="flex  flex-wrap gap-x-2.5 justify-start items-center">
          <p className="text-[0.8em] italic font-bold">Đánh giá:</p>
          <div className="flex  justify-center items-center gap-1">
            <div className="flex">
              {Array.from({ length: star }).map((_, i) => (
                <StartIcon
                  key={i}
                  className="w-[1.5em] h-[1.5em] fill-amber-400"
                ></StartIcon>
              ))}
            </div>
            <p className="">{star}</p>
          </div>
        </div>
        <div className="flex flex-wrap justify-star items-center gap-x-2.5">
          <p className="text-[0.8em] italic font-bold">Lượt xem:</p>
          <p>{view}</p>
        </div>
        <div className="flex flex-wrap justify-star items-center gap-x-2.5-2.5">
          <p className="text-[0.8em] italic font-bold">Chap mới nhất:</p>
          {newestStoryNode && (
            <div className="flex flex-wrap items-center justify-between w-full">
              <p>
                {newestStoryNode.type} {newestStoryNode.number}
              </p>
              <p className="text-[0.8em] italic">{newestStoryNode.timeLeft}</p>
            </div>
          )}
          <p></p>
        </div>
      </div>
    </Link>
  );
}

export default StoryHorizontalNavigation;
