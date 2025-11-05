import { useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import React from "react";

import TriangleDownIcon from "@/public/triangle-down.svg";
import SharpTriangleDownIcon from "@/public/sharp-triangle-down.svg";

interface ButtonDropdownProps {
  onClick?: () => void;
  onClickCloseButton?: () => void;
  label?: string | React.ReactNode;
  icon?: string | React.ReactNode;
  children?: React.ReactNode;
  styles?: React.CSSProperties;
  duration?: number;
  openOnLeft?: boolean;
  className?: string;
  showCloseButton?: boolean;
  closeButtonLabel?: string | React.ReactNode;
}

function ButtonDropdown({
  onClick,
  onClickCloseButton,
  label,
  icon,
  children,
  styles = {},
  duration = 100,
  openOnLeft = true,
  className = "",
  showCloseButton = false,
  closeButtonLabel = "Close",
}: ButtonDropdownProps) {
  const [open, setOpen] = useState<boolean>(false);
  const dropdown = useRef<HTMLDivElement>(null);

  // Use to catch event clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdown.current &&
        !dropdown.current.contains(event.target as Node)
      ) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  function toggleOpenDropdown() {
    setOpen(!open);
  }

  function handleClick() {
    onClick && onClick();
  }

  return (
    <div
      className={`flex flex-col relative justify-center items-start p-[1]
        font-afacad text-size-default text-foreground
        h-fit w-fit bg-background ${className}`}
      style={styles}
      ref={dropdown}
    >
      {/* Main button */}
      <div className="flex flex-row justify-center items-center gap-2.5 w-full h-fit ">
        {label && (
          <button className="w-fit h-full cursor-pointer" onClick={handleClick}>
            {label}
          </button>
        )}
        {(children || icon) && (
          <button
            className="cursor-pointer w-fit h-fit"
            onClick={toggleOpenDropdown}
          >
            {icon ? (
              icon
            ) : (
              <div className="w-[1em]">
                <TriangleDownIcon className="w-[1em] h-[1em]" />
              </div>
            )}
          </button>
        )}
      </div>

      {/* Dropdown list */}
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "fit-content", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: duration / 1000, ease: "linear" }}
            className={`relative z-10`}
          >
            <div
              className={`flex absolute top-3 flex-col justify-center items-start w-fit h-fit rounded-[5] min-w-64
                border-2 border-foreground p-2.5 gap-2.5 bg-background shadow-[11px_13px_5px_rgba(0,0,0,0.3)]
                ${openOnLeft ? "left-0" : "right-0"}`}
            >
              {/* List */}
              {children}
              {/* Close button */}
              {showCloseButton && (
                <button
                  className="px-5 w-full h-fit border-foreground border rounded-md cursor-pointer text-center"
                  onClick={() => {
                    toggleOpenDropdown?.();
                    onClickCloseButton?.();
                  }}
                >
                  {closeButtonLabel ?? closeButtonLabel}
                </button>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default ButtonDropdown;
