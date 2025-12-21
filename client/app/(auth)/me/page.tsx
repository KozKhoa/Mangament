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

const limit = 20;

export default function ProfilePage() {
  const auth = useAuth();
  const user = auth?.user;
  const router = useRouter();

  let currentFavPage: number = 1;
  let currentHisPage: number = 1;

  const [favourite, setFavourite] = useState<Story[]>([]);
  const [history, setHistory] = useState<History[]>([]);

  async function fetchFavourite(page: number, limit: number) {
    const res = await favouriteService.get({ limit: limit, page: page, sort: "created_at:desc" });

    if (!res) return toast.warning("Cannot connect with server");
    if (!res.success) return toast.warning(res.message);

    const fav: Favourite[] = res.data;

    if (!fav) return;
    setFavourite((prevFav) => [...prevFav, ...fav.map((item) => item.story)]);
  }

  async function fetchHistory(page: number, limit: number) {
    const res = await historyService.get({ limit: limit, page: page, sort: "created_at:desc" });

    if (!res) return toast.warning("Cannot connect with server");
    if (!res.success) return toast.warning(res.message);

    const his: History[] = res.data;
    if (!his) return;
    setHistory((prevHis) => [...prevHis, ...his]);

    setHistory(res.data);
  }

  useEffect(() => {
    fetchFavourite(currentFavPage, limit);
    fetchHistory(currentHisPage, limit);
  }, []);

  return (
    <>
      {user ? (
        <div className="flex flex-col gap-10 ">
          {/* User card */}
          <UserCard className="max-w-5xl m-auto"></UserCard>
          {/* Favourite story */}
          <StoryList
            label="Truyện yêu thích"
            stories={favourite}
            onClickLabel={() => router.push("/favourites")}
            onScrollToEnd={() => fetchFavourite(++currentFavPage, limit)}
          ></StoryList>

          <HistoryList
            histories={history}
            onClickLabel={() => router.push("/histories")}
            onScrollToEnd={() => fetchHistory(++currentHisPage, limit)}
            onRemoveElement={(removeElement) => {
              setHistory((prevHis) => prevHis.filter((x) => x !== removeElement));
            }}
          ></HistoryList>
        </div>
      ) : (
        <RequireLogin></RequireLogin>
      )}
    </>
  );
}
