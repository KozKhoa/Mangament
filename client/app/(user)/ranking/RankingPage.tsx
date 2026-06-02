"use client";

import CategoryCard from "@/components/cards/categories/category-card";
import { loadingBar } from "@/components/loadings/loading-bar/top-loading-bar.store";
import Link from "@/components/link/Link";
import { useEffect } from "react";
import Navbar from "@/components/layouts/navbar";

export default function RankingPage() {
  useEffect(() => {
    loadingBar.close();
  }, []);

  return (
    <>
      <div className="flex flex-col px-2">
        <Navbar items={["Ranking"]} className="p-2 px-3" />

        {/* Header use to display story type and page index */}
        <div
          className=" py-2 px-5 z-10 w-full
                flex flex-row flex-wrap justify-between items-center gap-2
                border-b-2 "
        >
          {/* Story type */}
          <h2 className="text-[2em] font-bold cursor-pointer">Xếp hạng</h2>
        </div>

        <div className="flex flex-row flex-wrap justify-center items-center gap-x-20 gap-y-10 m-auto w-fit py-10">
          <Link href={"/ranking/manga"}>
            <CategoryCard className="hover:scale-115" imageSource="/manga.jpg" label="MANGA" />
          </Link>

          <Link href={"/ranking/light_novel"}>
            <CategoryCard className="hover:scale-115" imageSource="/light_novel.jpg" label="LIGHT NOVEL"></CategoryCard>
          </Link>
        </div>
      </div>
    </>
  );
}
