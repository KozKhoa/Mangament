"use client";

import { useRouter } from "next/navigation";
import StoryDetailPage from "../[type]/[id]/page";
import storyService from "@/services/story";
import { toast } from "sonner";
import { useEffect } from "react";
import Loading from "@/components/loadings/loading";

export default function StoryRandomPage() {
  const router = useRouter();

  async function fetchRandomStory() {
    const res = await storyService.getRandomStory();

    if (!res) return toast.warning("Cannot connect with server");
    if (!res.success) return toast.warning(res.message);

    const story = res.data;

    router.push(`/story/${story.type}/${story.id}`);
  }

  useEffect(() => {
    fetchRandomStory();
  }, []);
  return (
    <div className="w-full h-[80vh] flex flex-col justify-center items-center gap-5">
      <h2>Đang random truyện cho bạn</h2>
      <Loading></Loading>
    </div>
  );
}
