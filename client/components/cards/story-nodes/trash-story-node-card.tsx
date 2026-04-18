import Button from "@/components/buttons/button";
import StoryNode from "@/types/story-node";
import { snakeCaseToCapitalizeWord } from "@/utils/string";
import Image from "next/image";
import { MouseEventHandler } from "react";

export default function TrashStoryNodeCard({
  storyNode,
  onRestore,
  onDelete,
  onClick,

  disable = false,

  className,
}: {
  storyNode: StoryNode;
  onRestore?: (storyNode: StoryNode) => void;
  onDelete?: (storyNode: StoryNode) => void;
  onClick?: MouseEventHandler<HTMLDivElement>;

  disable?: boolean;

  className?: string;
}) {
  const story = storyNode.story;
  const parent = storyNode.parent;

  return (
    <div
      className={`flex flex-col justify-between gap-3 p-3 bg-background-items rounded-lg shadow-md hover:shadow-lg transition-all duration-200 group ${className}`}
    >
      <div
        className="flex flex-col gap-3 cursor-pointer"
        onClick={(e) => {
          !disable && onClick?.(e);
        }}
      >
        {/* Story Cover Art & Meta */}
        <div className="relative">
          <div className="shrink-0 max-w-[200px] overflow-hidden rounded-md m-auto">
            {story?.cover_art?.key ? (
              <Image
                src={[process.env.NEXT_PUBLIC_CDN_URL, story.cover_art.key].join("/")}
                alt={story.title}
                width={200}
                height={150}
                className="object-cover group-hover:scale-110 transition-transform duration-300"
              />
            ) : story?.cover_art?.url ? (
              <Image
                src={story.cover_art.url}
                alt={story.title}
                width={200}
                height={150}
                className="object-cover group-hover:scale-110 transition-transform duration-300"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-foreground/30 text-center p-1">No Cover</div>
            )}
          </div>

          <div className="absolute bottom-1 right-1 flex flex-col gap-1 overflow-hidden text-background-items">
            <div className="flex flex-col items-end gap-1.5 ">
              <span className="font-black px-1.5 py-0.5 uppercase bg-foreground/80 rounded-md">{snakeCaseToCapitalizeWord(storyNode.type ?? "")}</span>
              <span className="font-bold px-1.5 py-0.5 bg-foreground/70 rounded-md"># {storyNode.order_index}</span>
            </div>
          </div>
        </div>

        {/* Node Title */}
        <div className="flex flex-col gap-1">
          <p className="font-bold text-foreground/40 uppercase tracking-wider truncate">{story?.title || "Unknown Story"}</p>
          <p className="text-base text-start leading-tight font-bold line-clamp-2 group-hover:text-primary transition-colors">
            {storyNode.title || "Untitled Node"}
          </p>
        </div>

        {/* Status & Info */}
        <div className="space-y-1 pt-1 border-t border-foreground/5 ">
          <div className="flex justify-between items-center text-sm">
            <span className="text-foreground/40 font-medium">Deleted Status:</span>
            <span
              className={`font-semibold px-1.5 py-0.5 rounded ${
                storyNode.deleted_status === "soft_deleted" ? "bg-yellow-500/10 text-yellow-500" : "bg-orange-500/10 text-orange-500"
              }`}
            >
              {snakeCaseToCapitalizeWord(storyNode.deleted_status || "")}
            </span>
          </div>
          {/* <div className="flex justify-between items-center ">
            <span className="text-foreground/40 font-medium">Node ID:</span>
            <span className="text-foreground/30 font-mono tracking-tighter uppercase">{storyNode.id}</span>
          </div> */}

          <p className="text-foreground/40 truncate">
            {parent ? (
              <>
                Parent:{" "}
                <span className="font-semibold">
                  {snakeCaseToCapitalizeWord(parent.type || "")} #{parent.order_index}
                </span>
              </>
            ) : (
              "Root Node"
            )}
          </p>
        </div>
      </div>

      <div className="flex flex-col gap-1.5 mt-2 text-sm lg:text-md">
        <Button
          buttonType="default"
          disable={disable}
          className="w-full py-1.5 font-semibold ring-offset-background transition-all hover:ring-2 hover:ring-primary/20"
          onClick={() => onRestore?.(storyNode)}
        >
          Khôi phục
        </Button>
        <Button
          buttonType="delete"
          disable={disable}
          className="w-full py-1.5 font-semibold ring-offset-background transition-all hover:ring-2 hover:ring-red-500/20"
          onClick={() => onDelete?.(storyNode)}
        >
          Xóa vĩnh viễn
        </Button>
      </div>
    </div>
  );
}
