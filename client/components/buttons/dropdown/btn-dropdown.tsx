import { useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import React from "react";
import { useFloating, offset, flip, shift } from "@floating-ui/react";

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

  const { refs, floatingStyles } = useFloating({
    middleware: [offset(10), flip(), shift({ padding: 10 })],
  });

  // Use to catch event clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdown.current && !dropdown.current.contains(event.target as Node)) {
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
      className={`flex flex-col relative justify-center items-start p-[1] text-foreground bg-background-items h-fit w-fit 
        ${className}`}
      ref={dropdown}
    >
      {/* Main button */}
      <div ref={refs.setReference} className="flex flex-row justify-center items-center gap-2.5 w-full h-full ">
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
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "fit-content", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: duration / 1000, ease: "linear" }}
            className={`relative z-10 w-fit`}
          >
            <div
              ref={refs.setFloating}
              style={floatingStyles}
              className={`flex absolute bg-background-items flex-col justify-center items-start w-fit h-fit rounded-[4]
                border-2 border-foreground p-2.5 gap-2.5 shadow-[11px_13px_5px_rgba(0,0,0,0.3)]
              `}
            >
              {/* List */}
              <div className="flex flex-col gap-2.5 max-h-[60vh] w-fit h-full overflow-y-scroll no-scrollbar p-1 min-w-64">{children}</div>

              <div className="flex flex-row w-full gap-2 justify-around">
                {/* Accept button */}
                {onClickAcceptButton && (
                  <button
                    className="px-5 text-[1.2em] font-semibold w-full h-fit border-background border rounded-md 
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
                    className="px-5 text-[1.2em] font-semibold w-full h-fit 
                    text-foreground
                    border-foreground border rounded-md cursor-pointer text-center"
                    onClick={() => {
                      toggleOpenDropdown?.();
                      onClickCloseButton?.();
                    }}
                  >
                    {closeButtonLabel ?? closeButtonLabel}
                  </button>
                )}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default ButtonDropdown;
