"use client";

import DEFAULT from "@/constants/default";
import storyService from "@/services/story";
import { StoryParams } from "@/types/params";
import Story from "@/types/story";
import { useParams } from "next/navigation";
import { useEffect, useState } from "react";
import { toast } from "sonner";

const LIMIT = 30;

export default function StoryGenrePage() {
  const param = useParams();

  const genre = param.name?.toString();

  const [page, setPage] = useState(1);

  const [stories, setStories] = useState<Story[] | null>(null);

  async function fetchStories() {
    if (!genre) return;
    const res = await storyService.get({ ...DEFAULT.params, ...{ genre: [genre], page: page, limit: LIMIT } });

    if (!res) return toast.warning("Cannot connect with server");
    if (!res.success) return toast.warning(res.message);

    setStories(res.data);

    console.log(res.data);
  }

  useEffect(() => {
    fetchStories();
  }, []);

  return <></>;
}
