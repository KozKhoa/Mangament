"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

import DEFAULT from "@/constants/default";
import History from "@/types/history";
import Story from "@/types/story";
import Genre from "@/types/genre";

import historyService from "@/services/history";
import storyService from "@/services/story";
import genreService from "@/services/genre";

import useAuth from "@/contexts/AuthContext";
import { routes } from "@/lib/routes";
import { loadingBar } from "@/components/loadings/loading-bar/top-loading-bar.store";

import ContinueReadingBar from "@/components/list/continue-reading-bar";
import InfinityScrollHorizontalList from "@/components/list/infinity-scroll-horizontal-list";
import CategoryCard from "@/components/cards/categories/category-card";
import StoryCard from "@/components/cards/stories/story-card";
import SwitchPageBig from "@/components/switch-page/big";
import Loading from "@/components/loadings/loading";
import Link from "@/components/link/Link";
import RankingVerticalCard from "@/components/cards/ranking-vertical-card";
import CircleRankingShowcase from "@/components/ranking/circle-ranking-showcase";
import { imageUrlResole } from "@/utils/imageUrlResole";

const MAX_TRENDING_GENRES = 5;
const NEWEST_STORIES_PER_PAGE = 18; // 18 truyện: chia hết cho 2, 3, 6 để lưới hiển thị luôn đồng đều

export default function Home() {
  const router = useRouter();
  const auth = useAuth();
  const newestSectionRef = useRef<HTMLDivElement>(null);

  const [histories, setHistories] = useState<History[] | null>(null);
  const [newestStories, setNewestStories] = useState<Story[]>([]);
  const [newestPage, setNewestPage] = useState(1);
  const [newestTotalPages, setNewestTotalPages] = useState(1);
  const [loadingNewest, setLoadingNewest] = useState(false);

  const [bestRankingStories, setBestRankingStories] = useState<Story[]>([]);
  const [mostViewedStories, setMostViewedStories] = useState<Story[]>([]);
  const [loadingMostViewed, setLoadingMostViewed] = useState(false);
  const [trendingGenres, setTrendingGenres] = useState<{ genre: Genre; score: number }[]>([]);

  async function removeHistory(history: History) {
    setHistories((prev) => (prev ? prev.filter((x) => x !== history) : null));
  }

  async function fetchNewestStories(page = 1) {
    setLoadingNewest(true);
    const res = await storyService.getStories({
      page: page,
      limit: NEWEST_STORIES_PER_PAGE,
      sort: "updated_at:desc",
      isGettingNewestChapter: true,
    });
    setLoadingNewest(false);

    if (!res) return toast.warning("Server Error");
    if (!res.success) return toast.warning(res.message);

    setNewestStories(res.data ?? []);
    if (res.pagination?.totalPages) {
      setNewestTotalPages(res.pagination.totalPages);
    }
  }

  function handlePageChange(newPage: number) {
    setNewestPage(newPage);
    fetchNewestStories(newPage);
    newestSectionRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  useEffect(() => {
    let isMounted = true;

    async function loadInitialData() {
      setLoadingNewest(true);
      setLoadingMostViewed(true);
      try {
        const [newestRes, rankingRes, mostViewedRes, genresRes] = await Promise.all([
          storyService.getStories({
            page: 1,
            limit: NEWEST_STORIES_PER_PAGE,
            sort: "updated_at:desc",
            isGettingNewestChapter: true,
          }),
          storyService.getStories({
            page: 1,
            limit: 10,
            sort: "star:desc",
          }),
          storyService.getStories({
            page: 1,
            limit: 10,
            sort: "view:desc",
          }),
          genreService.getTrendingGenres({ page: 1, limit: MAX_TRENDING_GENRES }),
        ]);

        if (!isMounted) return;

        if (newestRes?.success) {
          setNewestStories(newestRes.data ?? []);
          if (newestRes.pagination?.totalPages) {
            setNewestTotalPages(newestRes.pagination.totalPages);
          }
        }

        if (rankingRes?.success) {
          setBestRankingStories(rankingRes.data ?? []);
        }

        if (mostViewedRes?.success) {
          setMostViewedStories(mostViewedRes.data ?? []);
        }

        if (genresRes?.success) {
          setTrendingGenres(genresRes.data ?? []);
        }
      } catch {
        toast.warning("Lỗi kết nối máy chủ");
      } finally {
        if (isMounted) {
          setLoadingNewest(false);
          setLoadingMostViewed(false);
          loadingBar.close();
        }
      }
    }

    loadInitialData();

    return () => {
      isMounted = false;
    };
  }, []);

  useEffect(() => {
    if (!auth?.user) return;
    let isMounted = true;

    async function loadHistories() {
      const res = await historyService.getHistories({ ...DEFAULT.params, page: 1, limit: 10 });
      if (!isMounted) return;
      if (!res) return toast.warning("Server error");
      if (!res.success) return toast.warning(res.message);

      setHistories(res.data ?? []);
    }

    loadHistories();

    return () => {
      isMounted = false;
    };
  }, [auth?.user]);

  return (
    <div className="flex flex-col gap-10 px-1 py-8 max-w-[1800px] mx-auto w-full">
      {/* 1. Continue reading */}
      {auth?.user && (
        <ContinueReadingBar
          label="Tiếp tục đọc"
          onClickLabel={() => router.push(routes.history())}
          histories={histories}
          onRemoveElement={removeHistory}
          autoScrollInterval={5000}
        />
      )}

      {/* 2. Top 8 Truyện Xem Nhiều Nhất (Biểu đồ tròn 8 phần & Story Card) */}
      <CircleRankingShowcase
        label="Top 8 Xem Nhiều Nhất"
        subLabel="Biểu đồ tròn 8 phần tương ứng với 8 tác phẩm có lượt theo dõi và đọc nhiều nhất"
        stories={mostViewedStories}
        isLoading={loadingMostViewed}
      />

      {/* 3. Best ranking stories (Đánh giá cao nhất) */}
      <div className="flex flex-col gap-2 w-full">
        <InfinityScrollHorizontalList
          label="Đánh giá cao nhất"
          onClickLabel={() => router.push(routes.ranking())}
          numberOfElementInScreen={{
            basic: 2,
            sm: 2,
            md: 2,
            lg: 4,
            xl: 6,
          }}
          isLoading={bestRankingStories.length <= 0}
          autoSlide={4000}
        >
          {bestRankingStories.map((story, i) => (
            <div key={story.id} className="px-1 h-full">
              <RankingVerticalCard className="bg-background-items w-full h-full" story={story} top={i + 1} />
            </div>
          ))}
        </InfinityScrollHorizontalList>
      </div>

      {/* 3. Story type / Categories */}
      {/* <div className="flex flex-col gap-5">
        <h2 className="text-[2em] font-bold cursor-pointer border-b-2 w-fit m-auto">Danh mục truyện</h2>

        <div className="flex flex-row flex-wrap justify-center items-center gap-x-20 gap-y-10 m-auto w-fit">
          <CategoryCard className="hover:scale-110" imageSource="/manga.jpg" label="MANGA" onClick={() => router.push(routes.story({ storyType: "manga" }))} />
          <CategoryCard
            className="hover:scale-110"
            imageSource="/light_novel.jpg"
            label="LIGHT NOVEL"
            onClick={() => router.push(routes.story({ storyType: "light_novel" }))}
          />
        </div>
      </div> */}

      {/* 4. Genres list (Trending Tags) */}
      <InfinityScrollHorizontalList
        label="Tag nổi bật"
        onClickLabel={() => router.push(routes.genre())}
        numberOfElementInScreen={{
          basic: 1,
          sm: 2,
          md: 2,
          lg: 3,
          xl: 4,
        }}
        autoSlide={3000}
      >
        {trendingGenres.map(({ genre }) => (
          <div className="py-3.5 px-2" key={genre.id}>
            <Link href={`/genre/${genre.name}`}>
              <CategoryCard className="m-auto hover:scale-110 hover:z-10" imageSource={imageUrlResole(genre.thumbnail)} label={`${genre.name.toUpperCase()}`} />
            </Link>
          </div>
        ))}
      </InfinityScrollHorizontalList>

      {/* 5. Mới cập nhật (Chuyển thành Grid responsive 2-6 cột kèm phân trang) */}
      <div ref={newestSectionRef} className="flex flex-col gap-6 w-full">
        <div className="flex items-center justify-between border-b-2 border-foreground pb-2 px-5">
          <h2 onClick={() => router.push(routes.story())} className="text-2xl sm:text-3xl font-bold cursor-pointer hover:underline">
            Mới cập nhật
          </h2>
          {newestTotalPages > 1 && (
            <span className="text-sm font-semibold text-foreground/60">
              Trang {newestPage} / {newestTotalPages}
            </span>
          )}
        </div>

        {loadingNewest ? (
          <Loading className="w-full h-64" />
        ) : newestStories.length > 0 ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3 sm:gap-4 w-full">
            {newestStories.map((story) => (
              <div key={story.id} className="w-full h-full">
                <StoryCard className="bg-background-items w-full h-full" data={story} />
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-12 text-foreground/50 italic">Không có truyện mới cập nhật</div>
        )}

        {/* Phân trang (Pagination) */}
        {newestTotalPages > 1 && (
          <div className="flex justify-center items-center py-4">
            <SwitchPageBig page={newestPage} maxPage={newestTotalPages} onChange={handlePageChange} />
          </div>
        )}
      </div>
    </div>
  );
}
