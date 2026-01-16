"use client";

import usePaperClip from "@/hooks/usePaperClip";
import genreService from "@/services/genre";
import { snakeCaseToCapitalizeWord } from "@/utils/string";
import Link from "next/link";
import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { toast } from "sonner";

export function GenrePagerCard({ genre, className }: { genre: string; className?: string }) {
  const [ref, style] = usePaperClip();

  return (
    <div
      className="drop-shadow-[0_3px_3px_var(--foreground)]/5  transition-all duration-300
        hover:drop-shadow-[0_12px_5px_var(--foreground)]/20 hover:-translate-y-3"
    >
      <div
        ref={ref as any}
        style={style}
        className={`bg-background-items w-full h-fit flex flex-col shadow-md 
        ${className}`}
      >
        <Link href={`/genre/${genre}`}>
          <img className="w-full aspect-3/2" src={`/genres/${genre}.jpg`}></img>
        </Link>

        <div className="p-8 pt-2 flex flex-col gap-2 w-full">
          <Link href={`/genre/${genre}`}>
            <h2 className="font-semibold">{snakeCaseToCapitalizeWord(genre)}</h2>
          </Link>
          <p className="text-foreground/60 w-full">
            Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam,
            quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat. Duis aute irure dolor in reprehenderit in voluptate velit esse
            cillum dolore eu fugiat nulla pariatur. Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est
            laborum.
          </p>
        </div>
      </div>
    </div>
  );
}

export default function GenreListPage() {
  const [genres, setGenres] = useState<string[]>([]);

  async function fetchGenre() {
    const res = await genreService.get();

    if (!res.success) return toast.warning(res.message);

    setGenres(res.data);
  }

  useEffect(() => {
    fetchGenre();
  }, []);

  return (
    <div className="p-2">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-5 gap-x-2 gap-y-3">
        {genres.map((genre, i) => (
          <div key={genre}>
            <GenrePagerCard genre={genre}></GenrePagerCard>
          </div>
        ))}
      </div>
    </div>
  );
}
