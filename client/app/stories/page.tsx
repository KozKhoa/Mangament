"use client";

import CategoryCard from "@/components/cards/categories/category-card";
import { useRouter } from "next/navigation";

export default function StoriesPage() {
  const router = useRouter();

  return (
    <>
      <div className="flex flex-col">
        {/* Header use to display story type and page index */}
        <div
          className=" py-2 px-5 z-10 w-full
                      flex flex-row flex-wrap justify-between items-center gap-2
                      border-b-2 "
        >
          {/* Story type */}
          <h2 className="text-[2em] font-bold cursor-pointer">Loại truyện</h2>
        </div>

        <div className="flex flex-row flex-wrap justify-center items-center gap-x-20 gap-y-10 m-auto w-fit py-10">
          <CategoryCard className="hover:scale-110" imageSource="/manga.jpg" label="MANGA" onClick={() => router.push("/stories/manga")}></CategoryCard>
          <CategoryCard
            className="hover:scale-110"
            imageSource="/light_novel.jpg"
            label="LIGHT NOVEL"
            onClick={() => router.push("/stories/light_novel")}
          ></CategoryCard>
        </div>
      </div>
    </>
  );
}
