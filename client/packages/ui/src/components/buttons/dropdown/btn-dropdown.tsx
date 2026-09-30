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

  isBorderless?: boolean;
  isMainButtonMoveUp?: boolean;
  isCloseListOnClickOutside?: boolean;
  isCloseListOnClickInside?: boolean;

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
  openOnLeft,
  acceptButtonLabel = "Accept",
  closeButtonLabel = "Close",
  isBorderless = false,
  isMainButtonMoveUp = true,
  isCloseListOnClickOutside = true,
  isCloseListOnClickInside = false,
}: ButtonDropdownProps) {
  const [open, setOpen] = useState<boolean>(false);
  const dropdown = useRef<HTMLDivElement>(null);

  const initialPlacement = openOnLeft === false ? "bottom-end" : "bottom-start";

  const {
    refs: { setReference, setFloating },
    floatingStyles,
    placement,
  } = useFloating({
    placement: initialPlacement,
    whileElementsMounted: autoUpdate,
    transform: false,
    middleware: [
      offset(5),
      flip({
        fallbackPlacements: initialPlacement === "bottom-start" ? ["bottom-end", "top-start", "top-end"] : ["bottom-start", "top-end", "top-start"],
        padding: 8,
      }),
      shift({ padding: 8 }),
    ],
  });

  const isTop = placement.startsWith("top");

  // Only listen to click outside when dropdown is open
  useEffect(() => {
    if (!open) return;
    let timer: ReturnType<typeof setTimeout> | undefined;

    const handleClickOutside = (event: MouseEvent) => {
      if (dropdown.current && !dropdown.current.contains(event.target as Node)) {
        if (isCloseListOnClickOutside) {
          setOpen(false);
        }
      } else {
        if (isCloseListOnClickInside) {
          timer = setTimeout(() => {
            setOpen(false);
          }, 100);
        }
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      if (timer) clearTimeout(timer);
    };
  }, [open, isCloseListOnClickOutside, isCloseListOnClickInside]);

  function toggleOpenDropdown() {
    setOpen(!open);
  }

  function handleClick() {
    onClick?.();
  }

  return (
    <div
      className={`flex flex-col relative justify-center items-start text-foreground h-fit w-fit transition-all duration-150
        ${open ? (isTop ? "!border-t-0 !rounded-t-none z-50" : "!border-b-0 !rounded-b-none z-50") : ""}
        ${className}`}
      ref={(node) => {
        dropdown.current = node;
        setReference(node);
      }}
    >
      {/* Main button */}
      <div
        className={`flex flex-row justify-center items-center gap-2.5 w-full h-full z-40 ${isBorderless ? "" : "border border-foreground/30"} bg-background-items rounded-sm
          duration-${duration}
        ${open ? `${isMainButtonMoveUp ? "shadow-[3px_4px_1px_var(--foreground)]/40 -translate-y-1" : ""}` : ""}

        `}
      >
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
            style={{
              ...floatingStyles,
              transformOrigin: isTop ? (placement.endsWith("end") ? "bottom right" : "bottom left") : placement.endsWith("end") ? "top right" : "top left",
            }}
            initial={{ opacity: 0, scaleY: 0.96 }}
            animate={{ opacity: 1, scaleY: 1 }}
            exit={{ opacity: 0, scaleY: 0.96 }}
            transition={{ duration: Math.max(0.1, duration / 1000), ease: "easeOut" }}
            className={`flex absolute bg-background-items flex-col justify-center items-start w-fit h-fit z-50
                border-foreground/30 border p-2.5 gap-2.5 rounded-sm shadow-[4px_4px_1px_var(--foreground)]/40 
            `}
          >
            {/* List */}
            <div className="flex flex-col gap-2.5 max-h-[60vh] w-fit h-full overflow-y-auto custom-scrollbar p-1 min-w-64">{children}</div>

            <div className="flex flex-row w-full gap-2 justify-around">
              {/* Accept button */}
              {onClickAcceptButton && (
                <button
                  className="px-5 text-base font-semibold w-full h-fit border-background border rounded-sm 
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
                  className="px-5 text-base font-semibold w-full h-fit 
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
