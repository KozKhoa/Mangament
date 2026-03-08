"use client";

import { useEffect, useRef, useState } from "react";

import RequireLogin from "@/components/cards/require-login";
import UserCard from "@/components/cards/users/user-card";

import useAuth from "@/contexts/AuthContext";

import Favourite from "@/types/favourite";
import favouriteService from "@/services/favourite";
import { toast } from "sonner";
import StoryList from "@/components/list/stories-list";
import Story from "@/types/story";
import historyService from "@/services/history";
import History from "@/types/history";
import HistoryList from "@/components/list/history-list";
import { useRouter } from "next/navigation";
import withAuth from "@/hoc/withAuth";
import InfinityScrollHorizontalList from "@/components/list/infinity-scroll-horizontal-list";
import HistoryCard from "@/components/cards/history-card";

const LIMIT = 20;
const PAGE = 1;

export function ProfilePage() {
  const auth = useAuth();
  const user = auth?.user;
  const router = useRouter();

  const [favourite, setFavourite] = useState<Story[]>([]);
  const [histories, setHistories] = useState<History[]>([]);

  async function fetchFavourite() {
    const res = await favouriteService.getFavouriteStories({ limit: LIMIT, page: PAGE });

    if (!res.success) return toast.warning(res.message);

    const fav: Favourite[] = res.data ?? [];

    if (!fav) return;

    setFavourite(fav.map((item) => item.story));
  }

  async function fetchHistory() {
    const res = await historyService.getHistories({ limit: LIMIT, page: PAGE });

    if (!res.success) return toast.warning(res.message);

    setHistories(res.data ?? []);
  }

  useEffect(() => {
    fetchFavourite();
    fetchHistory();
  }, []);

  return (
    <>
      {user ? (
        <div className="flex flex-col gap-10 ">
          {/* User card */}
          <UserCard className="max-w-5xl m-auto"></UserCard>
          {/* Favourite story */}
          <StoryList label="Truyện yêu thích" stories={favourite} onClickLabel={() => router.push("/favourites")}></StoryList>

          <HistoryList
            histories={histories}
            onClickLabel={() => router.push("/histories")}
            onRemoveElement={(removeElement) => {
              setHistories((prevHis) => prevHis.filter((x) => x !== removeElement));
            }}
          ></HistoryList>
        </div>
      ) : (
        <RequireLogin></RequireLogin>
      )}
    </>
  );
}

export default withAuth(ProfilePage);
