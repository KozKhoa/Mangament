import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

import SharpTriangleDownIcon from "@/public/sharp-triangle-down.svg";
import StoryNode from "@/types/story-node";
import { capitalizeWords } from "@/utils/string";
import { diffDate } from "@/utils/date";
import { beautifulView } from "@/utils/beautiful";

interface ButtonStoryNodeExpandableProps {
  onClick?: (storyNode: StoryNode[]) => void;
  storyNode: StoryNode;

  className?: string;
}

export default function ButtonStoryNodeExpandable({ onClick, storyNode, className }: ButtonStoryNodeExpandableProps) {
  const [open, setOpen] = useState<boolean>(false);

  return (
    <div className={`flex flex-col w-full h-fit rounded-t-[5] overflow-hidden transition-all duration-100 ${className}`}>
      {/* Label*/}
      <button
        className={`flex flex-row justify-between items-center px-2 py-1.5 border-b border-foreground w-full cursor-pointer
          rounded-t-[5] hover:bg-foreground/20`}
        onClick={() => {
          setOpen(!open);
          onClick?.([storyNode]);
        }}
      >
        <div className="flex flex-row gap-1 overflow-hidden truncate">
          {storyNode.type !== "chapter" ? (
            <div className={`w-5 h-5 transition-all duration-100 ${open ? "" : "-rotate-90"}`}>
              <SharpTriangleDownIcon className="w-full h-full "></SharpTriangleDownIcon>
            </div>
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
              className={`flex w-full h-fit max-h-[700] overflow-y-scroll no-scrollbar
                border-b border-l border-foreground rounded-bl-md overflow-hidden`}
            >
              <ul className="flex flex-col justify-center items-start w-full h-fit">
                {storyNode.children.map((child, i) => (
                  <li key={i} className={`flex justify-start items-center w-full h-fit pt-2 ${i % 2 === 0 ? "" : "bg-foreground/3"} `}>
                    <ButtonStoryNodeExpandable onClick={(node) => onClick?.([storyNode].concat(node))} storyNode={child}></ButtonStoryNodeExpandable>
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
