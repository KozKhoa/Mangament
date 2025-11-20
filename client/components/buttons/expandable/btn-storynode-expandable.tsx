import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

import SharpTriangleDownIcon from "@/public/sharp-triangle-down.svg";
import StoryNode from "@/types/story-node";
import { capitalizeWords } from "@/utils/string";
import { diffDate } from "@/utils/date";
import { beautifulView } from "@/utils/beautiful";

interface ButtonStoryNodeExpandableProps {
  onClick?: (storyNodeId: string) => void;
  storyNode: StoryNode;

  className?: string;
}

export default function ButtonStoryNodeExpandable({ onClick, storyNode, className }: ButtonStoryNodeExpandableProps) {
  const [open, setOpen] = useState<boolean>(false);

  function handleClick(storyNodeId: string, storyNodeType: string) {
    if (storyNodeType !== "chapter") return storyNode.children && storyNode.children.length > 0 && setOpen(!open);
    onClick?.(storyNodeId);
  }

  return (
    <div
      className={`flex flex-col w-full h-fit font-afacad text-size-default rounded-t-[5] overflow-hidden 
        transition-all duration-100   ${className}`}
    >
      {/* Label*/}
      <button
        className={`flex flex-row justify-between items-center
        px-2 py-1.5 border-b border-foreground w-full rounded-t-[5] 
        hover:bg-hover-background ${open ? "bg-hover-background" : "bg-background"} ${className}`}
        onClick={() => handleClick(storyNode.id, storyNode.type)}
      >
        <div className="flex flex-row gap-1 overflow-hidden truncate">
          {storyNode.type !== "chapter" ? (
            open ? (
              <div className="w-5 h-5">
                <SharpTriangleDownIcon className="w-full h-full"></SharpTriangleDownIcon>
              </div>
            ) : (
              <div className="w-5 h-5 -rotate-90">
                <SharpTriangleDownIcon className="w-full h-full"></SharpTriangleDownIcon>
              </div>
            )
          ) : (
            <div className="w-5 h-5"></div>
          )}
          <p className="text-start">
            {capitalizeWords(storyNode.type)} {storyNode.order_index} {storyNode.title && ": " + storyNode.title}
          </p>
        </div>

        <div className="flex flex-row gap-4 ">
          <p className="text-end md:w-28 ">{beautifulView(storyNode.view ?? 0)}</p>
          <p className="text-end md:w-28 ">{diffDate(new Date(), new Date(storyNode?.created_at ?? ""))} ngày trước</p>
        </div>
      </button>

      {/* List of sub story node */}
      <AnimatePresence>
        {open && storyNode.children && storyNode.children.length > 0 && (
          <motion.div
            initial={{ height: 0 }}
            animate={{ height: "fit-content" }}
            exit={{ height: 0 }}
            transition={{ duration: 0.1, ease: "linear" }}
            className="pl-4 sm:pl-5 md:pl-6 w-full h-fit"
          >
            <div
              className={`flex w-full h-fit max-h-[700] overflow-y-scroll 
                border-b border-l border-foreground rounded-bl-md pt-1 overflow-hidden`}
            >
              <ul className="flex flex-col justify-center items-start w-full h-fit">
                {storyNode.children.map((child, i) => (
                  <li key={i} className={`flex justify-start items-center w-full h-fit`}>
                    <ButtonStoryNodeExpandable onClick={() => handleClick(child.id, child.type)} storyNode={child}></ButtonStoryNodeExpandable>
                  </li>
                ))}
              </ul>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
