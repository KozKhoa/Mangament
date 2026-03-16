import { useEffect, useState } from "react";
import SearchIcon from "@/public/search.svg";
import { useFloating, offset, flip, shift } from "@floating-ui/react-dom";
import { AnimatePresence, motion } from "framer-motion";

interface SearchBarProps {
  onSearch?: (text: string) => void;
  onType?: (text: string) => void;
  children?: React.ReactNode;

  delay?: number;

  placeHolder?: string;
  styles?: React.CSSProperties;
  className?: string;
}

function SearchBar({ onSearch, onType, children, placeHolder = "Tìm kiếm", styles = {}, className, delay = 0 }: SearchBarProps) {
  const { refs, floatingStyles } = useFloating({
    middleware: [offset(10), flip(), shift()],
  });

  const [text, setText] = useState<string>("");
  const [isFocus, setIsFocus] = useState(false);

  function handleSearch() {
    onSearch?.(text);
  }

  function handleTyping(text: string) {
    setText(text);
  }

  useEffect(() => {
    const timeout = setTimeout(() => onType?.(text), delay);

    return () => clearTimeout(timeout);
  }, [text]);

  return (
    <div onFocus={() => setIsFocus(true)} onBlur={() => setIsFocus(false)} className={`${className}`}>
      <div
        className={`flex flex-row justify-center items-center text-black w-full
        h-10 px-2.5 border border-foreground rounded-md bg-white relative ${className}`}
        style={styles}
      >
        {/* Input field */}
        <input
          className={`w-full h-fit border-0 outline-none   text-black`}
          type="text"
          value={text}
          placeholder={placeHolder}
          onChange={(e) => handleTyping(e.target.value)}
          onKeyDown={(e) => {
            e.key === "Enter" && handleSearch();
          }}
        ></input>

        {/* Search button */}
        <button className="cursor-pointer" onClick={handleSearch}>
          <SearchIcon className="w-6 h-6" />
        </button>
      </div>

      <AnimatePresence>
        {children && isFocus && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "fit-content", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.1, ease: "linear" }}
            className={`relative z-10`}
          >
            <div
              ref={refs.setFloating}
              style={floatingStyles}
              className={`flex absolute flex-col w-full h-fit rounded-[5] overflow-y-scroll no-scrollbar max-h-[70vh]
                        border-2 border-foreground p-1 bg-background shadow-[5px_5px_5px_rgba(0,0,0,0.3)] mt-2.5
                      `}
            >
              {children}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default SearchBar;
