import Story from "@/types/story";
import Button from "./button";
import User from "@/types/user";
import { useCallback, useEffect, useState } from "react";
import favouriteService from "@/services/favourite";
import { toast } from "sonner";

export default function ButtonOfFavouriteStory({ className, story }: { className?: string; story?: Story }) {
  const [processing, setProcessing] = useState(false);
  const [favouriteId, setFavouriteId] = useState<string | null>(story?.favourite?.id ?? null);

  const addStoryToFavourite = useCallback(async () => {
    if (!story) return;

    setProcessing(true);
    const res = await favouriteService.addNewFavouriteStory(story?.id);
    setProcessing(!res.success);

    if (!res.success) return toast.warning(res.message);

    toast.message("Add successfully");

    setFavouriteId(res.data?.id ?? null);

    return res.data;
  }, [story?.id]);

  const removeStoryFromFavouite = useCallback(async () => {
    if (!favouriteId) return;

    setProcessing(true);
    const res = await favouriteService.removeFavouriteStory(favouriteId);
    setProcessing(!res.success);

    if (!res.success) return toast.warning(res.message);

    toast.message("Remove successfully");

    setFavouriteId(null);
  }, [favouriteId]);

  const toggleFavourite = useCallback(() => {
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
      className={`${favouriteId ? "bg-red-400 text-white" : "bg-background-items"} font-semibold ${className}`}
    >
      {favouriteId ? "Đã yêu thích" : "Yêu thích"}
    </Button>
  );
}
