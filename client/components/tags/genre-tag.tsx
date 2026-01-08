import { snakeCaseToCapitalizeWord } from "@/utils/string";
import Link from "next/link";

export default function GenreTag({ tagName, className }: { className?: string; tagName?: string }) {
  return (
    <Link
      href={`/genre/${tagName}`}
      className={`px-1 py-0.5 rounded-[5] text-[1em] font-afacad text-foreground/70 bg-black/10 
        hover:bg-black/30 cursor-pointer
        ${className}`}
    >
      {tagName && <p>#{snakeCaseToCapitalizeWord(tagName)}</p>}
    </Link>
  );
}
