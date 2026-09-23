import { useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import React from "react";
import { useFloating, offset, flip, shift, autoUpdate } from "@floating-ui/react";

import TriangleDownIcon from "@/public/triangle-down.svg";

interface ButtonDropdownProps {
  onClick?: () => void;
  onClickAcceptButton?: () => void;
  onClickCloseButton?: () => void;
  label?: string | React.ReactNode;
  icon?: string | React.ReactNode;
  children?: React.ReactNode;
  duration?: number;
  openOnLeft?: boolean;
  className?: string;

  acceptButtonLabel?: string | React.ReactNode;
  closeButtonLabel?: string | React.ReactNode;
}

function ButtonDropdown({
  onClick,
  onClickCloseButton,
  onClickAcceptButton,
  label,
  icon,
  children,
  duration = 100,
  className = "",
  acceptButtonLabel = "Accept",
  closeButtonLabel = "Close",
}: ButtonDropdownProps) {
  const [open, setOpen] = useState<boolean>(false);
  const dropdown = useRef<HTMLDivElement>(null);

  const {
    refs: { setReference, setFloating },
    floatingStyles,
  } = useFloating({
    whileElementsMounted: autoUpdate,
    middleware: [offset(10), flip(), shift({ padding: 10 })],
  });

  // Only listen to click outside when dropdown is open
  useEffect(() => {
    if (!open) return;

    const handleClickOutside = (event: MouseEvent) => {
      if (dropdown.current && !dropdown.current.contains(event.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [open]);

  function toggleOpenDropdown() {
    setOpen(!open);
  }

  function handleClick() {
    onClick?.();
  }

  return (
    <div
      className={`flex flex-col relative justify-center items-start p-[1] text-foreground bg-background-items h-fit w-fit 
        ${className}`}
      ref={dropdown}
    >
      {/* Main button */}
      <div ref={setReference} className="flex flex-row justify-center items-center gap-2.5 w-full h-full ">
        {label && (
          <button className="w-fit h-full cursor-pointer" onClick={handleClick}>
            {label}
          </button>
        )}
        {(children || icon) && (
          <button className="cursor-pointer w-fit h-fit shrink-0" onClick={toggleOpenDropdown}>
            {icon ? icon : <TriangleDownIcon className="w-4 h-4" />}
          </button>
        )}
      </div>

      {/* Dropdown list */}
      <AnimatePresence>
        {open && (
          <motion.div
            ref={setFloating}
            style={floatingStyles}
            initial={{ opacity: 0, scale: 0.96, y: -4 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.96, y: -4 }}
            transition={{ duration: Math.max(0.1, duration / 1000), ease: "easeOut" }}
            className="flex absolute bg-background-items flex-col justify-center items-start w-fit h-fit rounded-sm border-foreground/30 border p-2.5 gap-2.5 shadow-[0px_5px_12px_5px_rgba(0,0,0,0.2)] z-50"
          >
            {/* List */}
            <div className="flex flex-col gap-2.5 max-h-[60vh] w-fit h-full overflow-y-auto custom-scrollbar p-1 min-w-64">{children}</div>

            <div className="flex flex-row w-full gap-2 justify-around">
              {/* Accept button */}
              {onClickAcceptButton && (
                <button
                  className="px-5 text-[1.1em] font-semibold w-full h-fit border-background border rounded-sm 
                cursor-pointer text-center bg-foreground text-background-items"
                  onClick={() => {
                    toggleOpenDropdown?.();
                    onClickAcceptButton?.();
                  }}
                >
                  {acceptButtonLabel ?? acceptButtonLabel}
                </button>
              )}
              {/* Close button */}
              {onClickCloseButton && (
                <button
                  className="px-5 text-[1.1em] font-semibold w-full h-fit 
                  text-foreground
                  border-foreground/30 border rounded-sm cursor-pointer text-center"
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
