"use client";

import { useRouter } from "next/navigation";
import storyService from "@/services/story";
import { toast } from "sonner";
import { useEffect } from "react";
import Loading from "@/components/loadings/loading";
import { loadingBar } from "@/components/loadings/loading-bar/top-loading-bar.store";

export default function StoryRandomPage() {
  const router = useRouter();

  useEffect(() => {
    async function fetchRandomStory() {
      loadingBar.open({});

      const res = await storyService.getRandomStory();

      if (!res.success) return toast.warning(res.message);

      const story = res.data;

      router.replace(`/stories/${story?.type}/${story?.title}`);
    }

    fetchRandomStory();
  }, []);

  return (
    <div className="w-full h-[80vh] flex flex-col justify-center items-center gap-5">
      <h2>Đang random truyện cho bạn</h2>
      <Loading></Loading>
    </div>
  );
}
