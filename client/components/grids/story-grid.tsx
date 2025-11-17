import { useEffect, useRef, useState } from "react";
import SwitchPageBig from "../switch-page/big";
import SwitchPageSmall from "../switch-page/small";
import FilterSort from "../filter-sorts/filter-sort";
import storyService from "@/services/story";
import Story from "@/models/story";
import StoryCard from "../cards/stories/story-card";
import StoryInfoCard from "../cards/stories/story-info-card";
import { convertNewestChapter } from "@/utils/convert";
import NewestChapter from "@/models/newest-chapter";
import favouriteService from "@/services/user/favourite";

interface StoryGridProps {
  label: string;
  type: "manga" | "light_novel";
  elemetsPerPage?: number;
  className?: string;
}

export default function StoryGrid({
  label,
  type,
  elemetsPerPage,
  className,
}: StoryGridProps) {
  const topRef = useRef<HTMLDivElement>(null); // This is use to scroll to top when switch page
  const [page, setPage] = useState<number>(1);
  const [maxPage, setMaxPage] = useState<number>(1);
  const [param, setParam] = useState({});
  const [limit, setLimit] = useState(elemetsPerPage ?? 18);

  const [stories, setStories] = useState<Story[]>();
  const [newestChapter, setNewestChapter] = useState<NewestChapter[][]>();

  const [storyIndex, setStoryIndex] = useState<number>(0);

  useEffect(() => {
    topRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [page]);

  useEffect(() => {
    const getStories = async () => {
      const res = await storyService.get({
        ...param,
        ...{ page: page, limit: limit },
        ...{ isGettingNewestChapter: true, isGettingSummary: true },
        ...{ type: type },
      });
      const stories = res.data;

      console.log(stories);

      setNewestChapter(
        stories.map((story: Story) => {
          return convertNewestChapter(story.newest_chapter || []);
        })
      );
      setStories(stories);
    };

    const getCountStories = async () => {
      const res = await storyService.count({
        ...param,
      });
      const count = res.data.count;

      setMaxPage(Math.ceil(count / limit));
    };

    getStories();
    getCountStories();
  }, [page, param]);

  return (
    <div
      ref={topRef}
      className={`font-afacad flex flex-row gap-5 ${className}`}
    >
      <div>
        <header
          className=" sticky top-12 flex flex-row flex-wrap bg-background z-10
          justify-between items-center border-b-2 py-2 px-5 gap-2"
        >
          <h2 className="text-[2em] font-bold">{label}</h2>
          <div
            className="flex flex-row flex-wrap justify-start items-center gap-2
            text-[1.2em] font-bold"
          >
            <SwitchPageSmall
              maxPage={maxPage}
              page={page}
              onChange={(pageNumber) => setPage(pageNumber)}
            ></SwitchPageSmall>
          </div>
        </header>
        <div className="flex flex-col gap-2 py-2  justify-start items-center">
          <FilterSort
            className="w-full"
            onChange={(param) => setParam(param)}
          ></FilterSort>
          <main
            className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-3 lg:grid-cols-5 xl:grid-cols-6 2xl:grid-cols-7 gap-2
            border-b-2 border-foreground pb-2
          "
          >
            {stories?.length !== undefined &&
              stories?.length > 0 &&
              stories.map((story, i) => (
                <div key={story.id} onMouseEnter={() => setStoryIndex(i)}>
                  <StoryCard
                    story={story}
                    newestChapter={newestChapter?.[i]}
                  ></StoryCard>
                </div>
              ))}
          </main>
          {page === maxPage && (
            <p className="text-[1.2em] italic">... Bạn đã ở cuối trang ...</p>
          )}

          <SwitchPageBig
            page={page}
            maxPage={maxPage}
            onChange={(pageNumber) => setPage(pageNumber)}
          ></SwitchPageBig>
        </div>
      </div>

      <StoryInfoCard
        className="hidden md:flex sticky top-30 mt-30"
        story={stories?.at(storyIndex)}
        newestChapter={newestChapter?.[storyIndex]}
      ></StoryInfoCard>
    </div>
  );
}
