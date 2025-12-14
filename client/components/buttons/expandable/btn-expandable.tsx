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

  function toggleOpenList() {
    setOpen(!open);
  }

  function handleClick() {
    onClick && onClick();
  }

  return (
    <div className={`flex flex-col gap-0 overflow-hidden w-full h-fit rounded-t-[5] ${className}`}>
      {/* Main button*/}
      <div
        className={`flex flex-row justify-between items-center 
        px-5 py-1.5 border-b border-foreground w-full rounded-t-[5] hover:bg-hover-background`}
      >
        <button className="cursor-pointer w-full text-start" onClick={handleClick}>
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
            <div
              className="flex flex-col justify-center items-start 
                border-b border-l border-foreground rounded-bl w-full h-fit"
            >
              {children}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default ButtonExpandable;
