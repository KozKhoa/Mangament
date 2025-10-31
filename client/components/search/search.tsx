import Image from "next/image";
import { ChangeEvent, KeyboardEventHandler, useState } from "react";

interface SearchBarProps {
  onSearch?: (text: string) => void;
  placeHolder?: string;
  styles?: React.CSSProperties;
}

function SearchBar({
  onSearch = () => {},
  placeHolder = "Tìm kiếm",
  styles = {},
}: SearchBarProps) {
  const [text, setText] = useState<string>("");

  function handleSearch() {
    onSearch(text);
  }

  return (
    <div
      className="flex flex-row justify-center items-center font-afacad w-full max-w-lg
        h-10 px-[10] border-[1] border-black rounded-[5] bg-white"
      style={styles}
    >
      {/* Input field */}
      <input
        className={`font-afacad text-[20] w-full h-full border-0 outline-none`}
        type="text"
        placeholder={placeHolder}
        onChange={(e: ChangeEvent<HTMLInputElement>) => setText(e.target.value)}
        onKeyDown={(e) => {
          e.key === "Enter" && handleSearch();
        }}
      ></input>

      {/* Search button */}
      <button className="cursor-pointer" onClick={handleSearch}>
        <Image
          src={"/search.svg"}
          alt="search-icon"
          width={25}
          height={25}
        ></Image>
      </button>
    </div>
  );
}

export default SearchBar;
