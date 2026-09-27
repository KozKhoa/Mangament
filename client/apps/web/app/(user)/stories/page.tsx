import CategoryCard from "@/components/cards/categories/category-card";
import Link from "@/components/link/Link";

export const metadata = {
  title: "Truyện",
};

export default function StoriesPage() {
  return (
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
        <Link href={"/stories/manga"}>
          <CategoryCard className="hover:scale-110" imageSource="/manga.jpg" label="MANGA"></CategoryCard>
        </Link>
        <Link href={"/stories/light_novel"}>
          <CategoryCard className="hover:scale-110" imageSource="/light_novel.jpg" label="LIGHT NOVEL"></CategoryCard>
        </Link>
      </div>
    </div>
  );
}
