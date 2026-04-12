"use client";

import History from "@/types/history";
import path from "path";
import StoryNode from "@/types/story-node";

import { snakeCaseToCapitalizeWord } from "@/utils/string";
import { useRouter } from "next/navigation";
import historyService from "@/services/history";
import { toast } from "sonner";
import Button from "@/components/buttons/button";

import EyeIcon from "@/public/eye/open.svg";
import { beautifulView } from "@/utils/beautiful";
import Image from "next/image";
import { useState } from "react";

export default function HistoryCard({ history, onClickRemove, className }: { history: History; onClickRemove?: () => void; className?: string }) {
  const story = history?.story;
  const router = useRouter();

  const [deleting, setDeleting] = useState(false);

  async function removeHistory(historId: string) {
    setDeleting(true);

    const res = await historyService.removeHistory(historId);

    if (!res.success) return toast.warning(res.message);

    toast.message(`Đã xóa ${history?.story?.title} khỏi lịch sử đọc`);

    setDeleting(false);
  }

  function convertStoryNodeTreeToArray(storyNode: StoryNode | null) {
    const arr: StoryNode[] = [];

    while (storyNode) {
      arr.push(storyNode);
      storyNode = storyNode.parent ?? null;
    }

    return arr.reverse();
  }

  const storyNodeArray = convertStoryNodeTreeToArray(history?.story_node);

  function navigateToStoryNode() {
    if (storyNodeArray[storyNodeArray.length - 1].type !== "chapter") return;

    let routeDir = "";
    storyNodeArray.forEach((node, i) => (routeDir = path.join(routeDir, `${node.type} ${node.order_index}`)));
    router.push(path.join(`/stories/${story.type}/${story.title}/`, routeDir));
  }

  function navigateToStory() {
    router.push(path.join(`/stories/${story.type}/${story.title}/`));
  }

  return (
    <div
      className={`flex flex-col justify-start items-center bg-background-items text-foreground gap-2.5 p-1.5 rounded-sm
        border-transparent border transition-all duration-100 ease-linear shadow-md
        max-w-sm w-full h-full
        ${className} `}
    >
      {/* Cover art */}
      <div className={`w-full cursor-pointer`}>
        {story?.cover_art?.url && (
          <Image
            className="aspect-7/10 object-contain rounded-sm overflow-hidden m-auto"
            onClick={() => navigateToStoryNode()}
            src={story?.cover_art?.url}
            alt="Cover Art"
            width={200}
            height={300}
          ></Image>
        )}

        {/* View */}
        <div
          className="flex flex-row justify-star items-center gap-x-1
          absolute right-0 bottom-0 px-1 bg-background-items rounded-tl-md"
        >
          <EyeIcon className="w-5 h-5"></EyeIcon>
          <p className="text-[0.8em] italic font-semibold">{beautifulView(story?.view || 0)}</p>
        </div>
      </div>

      <div className="flex flex-col justify-between gap-1 h-full w-full">
        {/* Title */}
        <div onClick={() => navigateToStory()} className="text-[1.2em] leading-tight cursor-pointer line-clamp-2">
          <p className="font-semibold">
            {story?.nation && (
              <span className="inline-block mr-1.5 align-middle">
                {story.nation.flag_image?.url ? (
                  <Image src={story.nation.flag_image.url} alt={story.nation.name} width={20} height={14} className="object-contain inline-block"></Image>
                ) : (
                  <span className="text-[1.2rem]">{story.nation.flag_icon}</span>
                )}
              </span>
            )}
            <span className="font-normal text-foreground/60">{"[" + snakeCaseToCapitalizeWord(story?.type ?? "") + "] "}</span>
            {story?.title}
          </p>
        </div>

        <div className="flex flex-col gap-2 w-full">
          {/* Reading chapter */}
          <div className="flex flex-row flex-wrap justify-between items-center gap-1">
            <div className="flex flex-row flex-wrap gap-1">
              {storyNodeArray.map((node, i) => (
                <p key={i} className="font-semibold text-lg">
                  {snakeCaseToCapitalizeWord(node.type)} {node.order_index} {i < storyNodeArray.length - 1 && " ➤ "}
                </p>
              ))}
            </div>
            <div className="flex flex-row gap-1 justify-between w-full">
              <p className="italic">{history?.updated_at ? new Date(history?.updated_at).toLocaleDateString("vi") : null}</p>
              <p className="font-semibold">{history?.updated_at ? new Date(history?.updated_at).toLocaleTimeString("vi").slice(0, -3) : ""}</p>
            </div>
          </div>

          {/* Remove history card */}
          <Button
            buttonType="delete"
            disable={deleting}
            isProcessing={deleting}
            onClick={async () => {
              await removeHistory(history.id);
              onClickRemove?.();
            }}
            className="w-full"
          >
            Xoá
          </Button>
        </div>
      </div>
    </div>
  );
}
