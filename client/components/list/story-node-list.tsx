import StoryNode from "@/types/story-node";
import Loading from "../loadings/loading";
import ButtonStoryNodeExpandable from "../buttons/expandable/btn-storynode-expandable";

interface StoryNodeListProps {
  storyNodes?: StoryNode[];
  size?: number;
  className?: string;

  onClickItem?: (storyNode: StoryNode[]) => void;
}

export default function StoryNodeList({ storyNodes, size, onClickItem, className }: StoryNodeListProps) {
  function handleClick(storyNode: StoryNode[]) {
    onClickItem?.(storyNode);
  }

  return (
    <div
      className={`flex flex-col border-2 border-foreground rounded-sm px-2.5 
       h-fit ${className}`}
    >
      {!storyNodes ? (
        <Loading className="w-full"></Loading>
      ) : (
        <div className="w-full">
          {/* Header */}
          <div className="px-2.5 py-1.5 border-b-2 border-foreground text-[1.2em] flex flex-row bg-background">
            <div className="flex flex-row justify-between w-full h-full">
              <p>Số chap / {size}</p>
              <div className="flex flex-row gap-3">
                <p className="text-end">Lượt xem</p>
                <p className="text-end">Ngày cập nhật</p>
              </div>
            </div>
          </div>

          {/* List */}
          <div className="w-full overflow-y-scroll max-h-[60vh]">
            <div className="flex flex-col gap-2 py-2 w-full h-fit">
              {storyNodes?.map((node, i) => (
                <ButtonStoryNodeExpandable onClick={handleClick} key={node.id} className="w-full" storyNode={node}></ButtonStoryNodeExpandable>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
