import Image from "next/image";
import { ChangeEvent, KeyboardEventHandler, useState } from "react";
import SearchIcon from "@/public/search.svg";

interface SearchBarProps {
  onSearch?: (text: string) => void;
  placeHolder?: string;
  styles?: React.CSSProperties;
  className?: string;
}

function SearchBar({ onSearch = () => {}, placeHolder = "Tìm kiếm", styles = {}, className }: SearchBarProps) {
  const [text, setText] = useState<string>("");

  function handleSearch() {
    onSearch(text);
  }

  return (
    <div
      className={`flex flex-row justify-center items-center     text-black w-full max-w-lg
        h-10 px-2.5 border border-foreground rounded-[5] bg-white  ${className}`}
      style={styles}
    >
      {/* Input field */}
      <input
        className={`w-full h-fit border-0 outline-none   text-black`}
        type="text"
        placeholder={placeHolder}
        onChange={(e: ChangeEvent<HTMLInputElement>) => setText(e.target.value)}
        onKeyDown={(e) => {
          e.key === "Enter" && handleSearch();
        }}
      ></input>

      {/* Search button */}
      <button className="cursor-pointer" onClick={handleSearch}>
        <SearchIcon className="w-6 h-6" />
      </button>
    </div>
  );
}

export default SearchBar;
