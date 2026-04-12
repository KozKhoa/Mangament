import Story from "@/types/story";
import Button from "./button";
import { useCallback, useEffect, useState } from "react";
import favouriteService from "@/services/favourite";
import { toast } from "sonner";
import useAuth from "@/contexts/AuthContext";

import HeartIcon from "@/public/heart-outline.svg";

export default function ButtonOfFavouriteStory({ className, story }: { className?: string; story?: Story }) {
  const auth = useAuth();
  const user = auth?.user;

  const [processing, setProcessing] = useState(false);
  const [favouriteId, setFavouriteId] = useState<string | null>(story?.favourite?.id ?? null);

  const addStoryToFavourite = useCallback(async () => {
    if (!story) return;

    setProcessing(true);
    const res = await favouriteService.addNewFavouriteStory(story?.id);
    setProcessing(!res.success);

    if (!res.success) return toast.warning(res.message);

    toast.message(`Thêm ${story.title} danh sách yêu thích thành công`);

    setFavouriteId(res.data?.id ?? null);

    return res.data;
  }, [story?.id]);

  const removeStoryFromFavouite = useCallback(async () => {
    if (!favouriteId) return;

    setProcessing(true);
    const res = await favouriteService.removeFavouriteStory(favouriteId);
    setProcessing(!res.success);

    if (!res.success) return toast.warning(res.message);

    toast.message(`Xóa ${story?.title} khỏi danh sách yêu thích thành công`);

    setFavouriteId(null);
  }, [favouriteId]);

  const toggleFavourite = useCallback(() => {
    if (!user) {
      toast.warning("Bạn cần đăng nhập trước");
      return;
    }

    if (favouriteId) {
      removeStoryFromFavouite();
    } else {
      story && addStoryToFavourite();
    }
  }, [addStoryToFavourite, removeStoryFromFavouite]);

  useEffect(() => {
    setFavouriteId(story?.favourite?.id ?? null);
  }, [story?.favourite?.id]);

  return (
    <Button
      onClick={toggleFavourite}
      isProcessing={processing}
      disable={processing}
      className={`${favouriteId ? "bg-red-500 text-white border-red-500" : "bg-background-items"} font-semibold  ${className}`}
    >
      <HeartIcon className="w-5 h-5 shrink-0" />
      {favouriteId ? "Đã thích" : "Yêu thích"}
    </Button>
  );
}
