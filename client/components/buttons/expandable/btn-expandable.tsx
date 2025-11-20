import Image from "next/image";
import { useState, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import React from "react";

import TriangleDownIcon from "@/public/triangle-down.svg";

interface ButtonDropDownProps {
  onClick?: () => void;
  label?: string | React.ReactNode;
  duration?: number;
  children?: React.ReactNode;

  className?: string;
}

function ButtonExpandable({
  label,
  onClick,
  duration = 100,
  children,

  className = "",
}: ButtonDropDownProps) {
  const [open, setOpen] = useState<boolean>(false);
  const childrenArray = useRef(React.Children.toArray(children));

  function toggleOpenList() {
    setOpen(!open);
  }

  function handleClick() {
    onClick && onClick();
  }

  return (
    <div className={`flex flex-col gap-0 overflow-hidden w-full h-fit font-afacad text-size-default rounded-t-[5] ${className}`}>
      {/* Main button*/}
      <div
        className={`flex flex-row justify-between items-center 
        px-5 py-1.5 border-b border-foreground w-full rounded-t-[5] hover:bg-hover-background`}
      >
        <button className="cursor-pointer" onClick={handleClick}>
          {typeof label === "string" && label}
        </button>
        {children && (
          <button className="cursor-pointer h-full justify-center items-center" onClick={toggleOpenList}>
            {typeof label === "string" ? <TriangleDownIcon className="text-foreground w-4 h-4" /> : label}
          </button>
        )}
      </div>

      {/* List of sub buttons */}
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ height: 0 }}
            animate={{ height: "fit-content" }}
            exit={{ height: 0 }}
            transition={{ duration: duration / 1000, ease: "linear" }}
            className={`flex pl-5 md:pl-7 lg:pl-10 w-full h-fit `}
          >
            <ul
              className="flex flex-col justify-center items-start 
                border-b border-l border-foreground rounded-bl w-full h-fit"
            >
              {childrenArray.current.map((child, index) => (
                <li
                  key={index}
                  className={`flex justify-start items-center w-full h-fit px-5 py-2 hover:bg-hover-background ${
                    index === childrenArray.current.length - 1 ? "border-b-0" : "border-b"
                  }`}
                >
                  {child}
                </li>
              ))}
            </ul>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default ButtonExpandable;
