"use client";

import { loadingBar } from "@/components/loadings/loading-bar/top-loading-bar.store";

import Link from "@/components/link/Link";
import { Ref, useEffect, useState } from "react";

import Navbar from "@/components/layouts/navbar";
import Genre from "@/types/genre";
import useApp from "@/contexts/AppContext";
import Image from "next/image";
import Loading from "@/components/loadings/loading";

export function GenrePagerCard({ genre, className }: { genre: Genre; className?: string }) {
  return (
    <div
      className="drop-shadow-[0_3px_3px_var(--foreground)]/5  transition-all w-full h-full
        hover:drop-shadow-[0_12px_5px_var(--foreground)]/20"
    >
      <div
        className={`bg-background-items w-full h-full flex flex-col shadow-md clip-path-paper hover:-translate-y-3 duration-300 
        ${className}`}
      >
        <Link href={`/genre/${genre.name}`}>
          <Image
            className="w-full aspect-3/2"
            src={[process.env.NEXT_PUBLIC_CDN_URL, genre.thumbnail?.key].join("/")}
            alt={genre.name}
            width={200}
            height={150}
          />
        </Link>

        <div className="p-8 pt-2 flex flex-col gap-2 w-full">
          <Link href={`/genre/${genre.name}`}>
            <h2 className="font-semibold">{genre.name}</h2>
          </Link>
          <p className="text-foreground/60 w-full">
            {genre.description ??
              `Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam,
            quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat. Duis aute irure dolor in reprehenderit in voluptate velit esse
            cillum dolore eu fugiat nulla pariatur. Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est
            laborum.`}
          </p>
        </div>
      </div>
    </div>
  );
}

export default function GenreListPage() {
  const app = useApp();

  const [genres, setGenres] = useState<Genre[]>(app?.genres ?? []);

  useEffect(() => {
    setGenres(app?.genres ?? []);

    loadingBar.close();
  }, [app?.genres, app?.loading]);

  return (
    <div className="p-2">
      <Navbar items={["Genre"]} className="p-2 px-3" />

      {app?.loading && <Loading className="h-96" />}

      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-x-2 gap-y-3">
        {genres.map((genre) => (
          <div key={genre.id} className="w-full h-full">
            <GenrePagerCard genre={genre} />
          </div>
        ))}
      </div>
    </div>
  );
}
