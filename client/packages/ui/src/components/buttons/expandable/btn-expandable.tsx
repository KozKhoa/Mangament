import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import React from "react";

import TriangleDownIcon from "@/public/triangle-down.svg";

interface ButtonDropDownProps {
  onClick?: () => void;
  label?: string | React.ReactNode;
  icon?: React.ReactNode;
  duration?: number;
  children?: React.ReactNode;

  className?: string;
}

function ButtonExpandable({
  label,
  icon,
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
    onClick?.();
  }

  return (
    <div className={`overflow-hidden`}>
      {/* Main button*/}
      <div
        className={`flex flex-row justify-between items-center gap-2.5 px-4 py-2 border-b border-foreground 
          w-full ${!children ? "rounded-md" : "rounded-t-md"} transition-colors hover:bg-foreground/20 ${className}`}
      >
        {!children ? (
          <button className="cursor-pointer w-full text-start flex items-center gap-2.5" onClick={handleClick}>
            {icon && <span className="shrink-0 flex items-center justify-center">{icon}</span>}
            {typeof label === "string" ? <span className="truncate">{label}</span> : label}
          </button>
        ) : typeof label === "string" || icon ? (
          <>
            <button className="cursor-pointer w-full text-start flex items-center gap-2.5" onClick={handleClick}>
              {icon && <span className="shrink-0 flex items-center justify-center">{icon}</span>}
              {typeof label === "string" ? <span className="truncate">{label}</span> : label}
            </button>
            <button className="cursor-pointer h-full justify-center items-center pl-1 shrink-0" onClick={toggleOpenList}>
              <TriangleDownIcon className="text-foreground w-4 h-4 shrink-0" />
            </button>
          </>
        ) : (
          <button className="cursor-pointer h-full w-full justify-center items-center" onClick={toggleOpenList}>
            {label}
          </button>
        )}
      </div>

      {/* List of sub buttons */}
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: Math.max(0.1, duration / 1000), ease: "easeOut" }}
            className={`flex pl-5 md:pl-7 w-full h-fit `}
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
