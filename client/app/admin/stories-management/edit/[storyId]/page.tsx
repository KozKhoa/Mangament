"use client";

import { TargetStoryStatus } from "@/components/filters/filter-story-status";
import Input from "@/components/inputs/input";
import ImagePicker from "@/components/inputs/image-picker";
import Loading from "@/components/loadings/loading";
import StoryGenreMultiSelection from "@/components/selections/story-genres-multi-selection";
import StoryStatusSelection from "@/components/selections/story-status-selection";
import adminService from "@/services/admin";
import Story from "@/types/story";
import { useParams } from "next/navigation";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import TextArea from "@/components/inputs/text-area";

export default function EditStory() {
  const params = useParams();

  const [story, setStory] = useState<Story | null>(null);
  const [editedStory, setEditedStory] = useState<Story | null>(story);

  const [loading, setLoading] = useState(true);

  const storyId = params["storyId"]?.toString() ?? "";

  async function fetchStory() {
    setLoading(true);
    const res = await adminService.getStory(storyId);
    setLoading(false);

    if (!res.success) return toast.warning(res.message);

    setStory(res.data ?? null);
  }

  function setTitle(title: string) {
    setEditedStory((prev) => {
      if (!prev) return prev;
      const next = { ...prev };
      next.title = title;
      return next;
    });
  }

  function setNation(nation: string) {
    setEditedStory((prev) => {
      if (!prev) return prev;
      const next = { ...prev };
      next.nation = nation;
      return next;
    });
  }

  function setStoryStatus(status: string) {
    setEditedStory((prev) => {
      if (!prev) return prev;
      const next = { ...prev };
      next.status = status;
      return next;
    });
  }

  function setGenres(genres: string[]) {
    setEditedStory((prev) => {
      if (!prev) return prev;
      const next = { ...prev };
      next.genres = genres;
      return next;
    });
  }

  useEffect(() => {
    fetchStory();
  }, []);

  useEffect(() => {
    setEditedStory(story);
  }, [story]);

  return (
    <div className="">
      {loading ? (
        <Loading className="h-screen"></Loading>
      ) : (
        <div className="flex flex-col gap-5 w-full">
          <h2 className="font-semibold m-auto">{story?.title}</h2>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 ">
            <ImagePicker className="col-span-1" defaultValue={story?.cover_art.url} onReset={() => {}}></ImagePicker>

            <div className="flex flex-col gap-2 w-full lg:col-span-2">
              <Input label="Title" placeHolder={story?.title} defaultValue={story?.title} onChange={setTitle} onReset={setTitle}></Input>
              <Input label="Nation" placeHolder={story?.nation} defaultValue={story?.nation} onChange={setNation} onReset={setNation}></Input>
              <StoryStatusSelection
                defaultValue={story?.status as TargetStoryStatus}
                onChange={(status) => setStoryStatus(status ?? "")}
              ></StoryStatusSelection>
              <StoryGenreMultiSelection defaultValue={story?.genres} onChange={setGenres}></StoryGenreMultiSelection>
            </div>
          </div>

          <TextArea label="Tóm tắt / Mô tả truyện" placeHolder={story?.summary} defaultValue={story?.summary}></TextArea>
        </div>
      )}
    </div>
  );
}
