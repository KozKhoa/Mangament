import StoryNode from "@/types/story-node";
import Loading from "../loadings/loading";
import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

import SharpTriangleDownIcon from "@/public/sharp-triangle-down.svg";
import { capitalizeWords } from "@/utils/string";
import { beautifulView } from "@/utils/beautiful";

interface StoryNodeListProps {
  storyNodes?: StoryNode[];
  size?: number;
  className?: string;

  onClickItem?: (storyNode: StoryNode[]) => void;
  targetStoryNode?: StoryNode;
}

interface ButtonStoryNodeExpandableProps {
  index: number;
  onClick?: (storyNode: StoryNode[]) => void;
  storyNode: StoryNode;
  className?: string;
  targetStoryNodeId?: string;
}

const ButtonStoryNodeExpandable = React.memo(function ButtonStoryNodeExpandable({
  index,
  onClick,
  storyNode,
  className,
  targetStoryNodeId,
}: ButtonStoryNodeExpandableProps) {
  const containsTarget = React.useMemo(() => {
    if (!targetStoryNodeId || !storyNode.children) return false;
    const checkContainsTarget = (children?: StoryNode[]): boolean => {
      if (!children) return false;
      for (const child of children) {
        if (child.id === targetStoryNodeId) return true;
        if (checkContainsTarget(child.children)) return true;
      }
      return false;
    };
    return checkContainsTarget(storyNode.children);
  }, [targetStoryNodeId, storyNode.children]);

  const [open, setOpen] = useState<boolean>(() => containsTarget);
  const containerRef = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    if (containsTarget) {
      setOpen(true);
    }
  }, [containsTarget]);

  React.useEffect(() => {
    if (!targetStoryNodeId || storyNode.id !== targetStoryNodeId) return;

    const el = containerRef.current;
    if (!el) return;

    const frameId = requestAnimationFrame(() => {
      let parent = el.parentElement;
      let scrollContainer: HTMLElement | null = null;

      while (parent && parent !== document.body && parent !== document.documentElement) {
        const style = window.getComputedStyle(parent);
        if (style.overflowY === "auto" || style.overflowY === "scroll") {
          scrollContainer = parent;
          break;
        }
        parent = parent.parentElement;
      }

      if (scrollContainer) {
        const containerRect = scrollContainer.getBoundingClientRect();
        const elRect = el.getBoundingClientRect();
        const offsetTop = elRect.top - containerRect.top + scrollContainer.scrollTop;
        const targetScrollTop = offsetTop - containerRect.height / 2 + elRect.height / 2;

        scrollContainer.scrollTop = Math.max(0, targetScrollTop);
      }
    });

    return () => cancelAnimationFrame(frameId);
  }, [targetStoryNodeId, storyNode.id]);

  const isTarget = storyNode.id === targetStoryNodeId;

  return (
    <div ref={containerRef} className="flex flex-col w-full h-fit overflow-hidden">
      {/* Label*/}
      <div
        className={`flex flex-row justify-between items-center px-2 py-2 w-full cursor-pointer
          ${index % 2 === 0 ? "bg-background-items" : "bg-foreground/10"} ${className}
          ${isTarget ? "text-background-items bg-foreground/99 hover:bg-foreground/80" : "text-foreground hover:bg-foreground/20"}`}
        onClick={() => {
          setOpen(!open);
          onClick?.([storyNode]);
        }}
      >
        <div className="flex flex-row gap-1 justify-start items-start overflow-hidden flex-1">
          {storyNode.type !== "chapter" ? (
            <div className={` transition-all duration-100 ${open ? "" : "-rotate-90"}`}>
              <SharpTriangleDownIcon className="w-5 h-5"></SharpTriangleDownIcon>
            </div>
          ) : (
            <div className="w-5 h-5"></div>
          )}
          <p className="text-start w-full truncate">
            {capitalizeWords(storyNode.type)} {storyNode.order_index} {storyNode.title && ": " + storyNode.title}
          </p>
        </div>

        <div className="md:w-28 shrink-0 pr-2">
          <p className="text-end">{beautifulView(storyNode.view ?? 0)}</p>
        </div>
        <div className="md:w-28 shrink-0">
          <p className="text-end">{new Date(storyNode?.created_at ?? "").toLocaleDateString("vi-VN")}</p>
        </div>
      </div>

      {/* List of sub story node */}
      <AnimatePresence initial={false}>
        {open && storyNode.children && storyNode.children.length > 0 && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.15, ease: "easeOut" }}
            className="pl-4 sm:pl-5 md:pl-6 w-full h-fit mb-1"
          >
            <div className="flex w-full h-fit border-b border-l border-foreground rounded-bl-md overflow-hidden">
              <div className="flex flex-col justify-center items-start w-full h-fit">
                {storyNode.children.map((child, i) => (
                  <div key={child.id ?? i} className={`flex justify-start items-center w-full h-fit`}>
                    <ButtonStoryNodeExpandable
                      className={`${i === (storyNode?.children?.length ?? 0) - 1 ? "" : "border-b border-foreground"}`}
                      index={i}
                      onClick={(node) => onClick?.([storyNode].concat(node))}
                      storyNode={child}
                      targetStoryNodeId={targetStoryNodeId}
                    />
                  </div>
                ))}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
});

export default function StoryNodeList({ storyNodes, onClickItem, className, targetStoryNode }: StoryNodeListProps) {
  function handleClick(storyNode: StoryNode[]) {
    onClickItem?.(storyNode);
  }

  return (
    <div className={`flex flex-col border border-foreground/30 rounded-sm px-2.5 py-2 ${className ?? "h-fit"}`}>
      {!storyNodes ? (
        <Loading className="w-full h-64"></Loading>
      ) : (
        <div className="w-full flex flex-col flex-1 min-h-0">
          <div className="flex flex-row items-center justify-between px-2 pb-1.5 border-b border-foreground text-[1.1em] font-bold w-full shrink-0">
            <div className="flex-1 text-left">Title</div>
            <div className="md:w-28 shrink-0 text-end pr-2">View</div>
            <div className="md:w-28 shrink-0 text-end">Date</div>
          </div>

          <div className="w-full overflow-y-auto max-h-[65vh] flex-1 custom-scrollbar">
            <div className="flex flex-col py-2 w-full h-fit">
              {storyNodes?.map((node, i) => (
                <ButtonStoryNodeExpandable
                  className="border-b border-foreground"
                  index={i}
                  key={node.id}
                  onClick={handleClick}
                  storyNode={node}
                  targetStoryNodeId={targetStoryNode?.id}
                />
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
