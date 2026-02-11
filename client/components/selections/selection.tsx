import ButtonDropdown from "../buttons/dropdown/btn-dropdown";
import StarIcon from "@/public/star.svg";
import TickIcon from "@/public/tick-o.svg";

import SharpTriangleDownIcon from "@/public/sharp-triangle-down.svg";
import ArrowDownIcon from "@/public/arrows/down-v.svg";
import ReloadIcon from "@/public/reload.svg";

import Tag from "../tags/tag";

import Checkbox from "../inputs/checkbox";
import { useEffect, useRef, useState } from "react";
import StoryStatusTag from "../tags/story-status-tag";
import { AnimatePresence, motion } from "framer-motion";
import { flip, offset, shift, useFloating } from "@floating-ui/react-dom";
import { snakeCaseToAllCapital, snakeCaseToCapitalizeWord } from "@/utils/string";

interface StoryStatusSelectionProps {
  // Define any props if needed in the future
  className?: string;

  label?: string | React.ReactNode;

  defaultIndex?: number;

  options: any[];

  onChange?: (index: number | null) => void;

  onReset?: (index: number | null) => void;
}

export default function Selection({ className, defaultIndex, label, options, onChange, onReset }: StoryStatusSelectionProps) {
  const dropdown = useRef<HTMLDivElement>(null);

  const { refs, floatingStyles } = useFloating({
    middleware: [offset(8), flip(), shift({ padding: 10 })],
  });

  const [selectedIndex, setSelectedIndex] = useState<number | null>(defaultIndex ?? null);

  const [open, setOpen] = useState(false);

  function handleReset() {
    setSelectedIndex(defaultIndex ?? null);
    onReset?.(defaultIndex ?? null);
  }

  function handleSelected(index: number | null) {
    setSelectedIndex(index);
    onChange?.(index);
  }

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

  useEffect(() => {
    if (defaultIndex) setSelectedIndex(defaultIndex ?? null);
  }, [defaultIndex]);

  return (
    <div className={`flex flex-col gap-1 text-foreground relative ${className}`}>
      {(label || onReset) && (
        <div className="flex flex-row flex-wrap items-center justify-between gap-1 px-1">
          <div className="font-bold">{label}</div>

          {onReset && <ReloadIcon onClick={handleReset} className="w-5 h-5 fill-foreground cursor-pointer hover:animate-spin"></ReloadIcon>}
        </div>
      )}

      <div ref={dropdown} className="relative">
        <div
          ref={refs.setReference}
          onClick={() => setOpen(!open)}
          className="flex gap-0.5 items-center justify-between
            px-3 py-2 border bg-background-items rounded-[5] min-h-10.5 cursor-pointer"
        >
          <div className="flex flex-row flex-wrap gap-1">{selectedIndex !== null ? options.at(selectedIndex) : ""}</div>

          <ArrowDownIcon className={`w-4 h-4 fill-foreground duration-100 ${open ? "rotate-180" : "rotate-0"}`}></ArrowDownIcon>
        </div>

        <AnimatePresence>
          {open && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "fit-content", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.1, ease: "linear" }}
              className={`relative z-10 w-full`}
            >
              <div
                ref={refs.setFloating}
                style={floatingStyles}
                className={`flex absolute bg-background-items flex-col justify-center items-start w-full h-fit rounded-[4]
                border-2 border-foreground gap-2.5 pb-1 px-0.5 shadow-[11px_13px_5px_rgba(0,0,0,0.3)]
              `}
              >
                <div className="flex flex-col md:grid md:grid-cols-2 gap-2 max-h-[60vh] w-full h-full overflow-y-scroll no-scrollbar p-1 min-w-64">
                  {options?.map((op, index) => (
                    <div key={index} className="bg-background-items hover:bg-foreground/10 px-1 rounded-sm">
                      <button
                        onClick={() => {
                          setOpen(false);
                          handleSelected(index);
                        }}
                        className="w-full text-start py-2 px-5 cursor-pointer border-b border-foreground/30"
                      >
                        {op}
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
