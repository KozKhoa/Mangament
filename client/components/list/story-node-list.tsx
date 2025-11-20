import StoryNode from "@/types/story-node";
import Loading from "../loadings/loading";
import ButtonExpandable from "../buttons/expandable/btn-expandable";
import { capitalizeWords } from "@/utils/string";
import ButtonStoryNodeExpandable from "../buttons/expandable/btn-storynode-expandable";

interface StoryNodeListProps {
  storyNodes?: StoryNode[];
  size?: number;
  className?: string;
}

export default function StoryNodeList({ storyNodes, size, className }: StoryNodeListProps) {
  function handleClick(storyNodeId: string) {
    console.log(storyNodeId);
  }

  return (
    <div
      className={`flex flex-col border-2 border-foreground rounded-sm font-afacad px-2.5 
      relative max-h-[1000] h-fit overflow-y-scroll  ${className}`}
    >
      {!storyNodes ? (
        <Loading className="w-full"></Loading>
      ) : (
        <>
          <div className="w-full">
            {/* Header */}
            <div className=" sticky top-0 px-2.5 py-1.5 border-b-2 border-foreground text-[1.2em] flex flex-row bg-background">
              <div className="flex flex-row justify-between w-full h-full">
                <p>Số chap / {size}</p>
                <div className="flex flex-row gap-3">
                  <p className="text-end">Lượt xem</p>
                  <p className="text-end">Ngày cập nhật</p>
                </div>
              </div>
            </div>

            {/* Story node list */}
            <div className="flex flex-col gap-2 py-3 w-ful">
              {storyNodes?.map((node, i) => (
                <ButtonStoryNodeExpandable onClick={handleClick} key={node.id} className="w-full" storyNode={node}></ButtonStoryNodeExpandable>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
