import History from "@/types/history";
import path from "path";
import StoryNode from "@/types/story-node";
import { convertDateTo_yyyMMdd, convertDateTo_yyyMMddHHmm } from "@/utils/convert";

import { snakeCaseToCapitalizeWord } from "@/utils/string";
import { useRouter } from "next/navigation";
import historyService from "@/services/history";
import { toast } from "sonner";
import Button from "@/components/buttons/button";

import EyeIcon from "@/public/eye/open.svg";
import { beautifulView } from "@/utils/beautiful";
import Image from "next/image";

async function removeHistory(historId: string) {
  const res = await historyService.removeHistory(historId);

  if (!res) return toast.warning("Cannot connect with server");
  if (!res.success) return toast.warning(res.message);

  toast.message("Remove reading history successfully");

  return res.data;
}

function convertStoryNodeTreeToArray(storyNode: StoryNode | null) {
  const arr: StoryNode[] = [];

  while (storyNode) {
    arr.push(storyNode);
    storyNode = storyNode.parent ?? null;
  }

  return arr.reverse();
}

export default function HistoryCard({ history, onClickRemove, className }: { history: History; onClickRemove?: () => void; className?: string }) {
  const story = history?.story;
  const router = useRouter();

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
      className={`flex flex-col justify-start items-center bg-background-items text-foreground gap-2.5 p-1.5 rounded-[5]
        border-transparent border-2 transition-all duration-100 ease-linear shadow-md
        max-w-sm w-full h-full
        ${className} `}
    >
      {/* Cover art */}
      <div className={`w-full cursor-pointer`}>
        {story?.cover_art?.url && (
          <Image
            className="aspect-7/10 object-contain rounded-sm overflow-hidden"
            onClick={() => navigateToStoryNode()}
            src={story?.cover_art?.url}
            alt="Cover Art"
            width={500}
            height={500}
            unoptimized
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
        {/* Tittle */}
        <div onClick={() => navigateToStory()} className="text-[1.2em] font-bold leading-tight cursor-pointer line-clamp-2">
          {"[" + snakeCaseToCapitalizeWord(story?.type ?? "") + "] " + story?.title}
        </div>

        <div className="flex flex-col gap-2 w-full">
          {/* Reading chapter */}
          <div className="flex flex-row flex-wrap justify-between items-center gap-1">
            <div className="flex flex-row flex-wrap gap-1">
              {storyNodeArray.map((node, i) => (
                <p key={i} className="font-semibold">
                  {snakeCaseToCapitalizeWord(node.type)} {node.order_index} {i < storyNodeArray.length - 1 && " ➤ "}
                </p>
              ))}
            </div>
            <p className="italic">{convertDateTo_yyyMMddHHmm(history?.updated_at ? new Date(history?.updated_at) : null)}</p>
          </div>

          {/* Remove history card */}
          <Button
            buttonType="delete"
            onClick={() => {
              removeHistory(history.id);
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
