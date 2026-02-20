"use client";

import { TargetStoryStatus } from "@/components/filters/filter-story-status";
import Input from "@/components/inputs/input";
import ImagePicker from "@/components/inputs/image-picker";
import Loading from "@/components/loadings/loading";
import StoryGenreMultiSelection from "@/components/selections/story-genres-multi-selection";
import StoryStatusSelection from "@/components/selections/story-status-selection";
import adminService from "@/services/admin";
import Story from "@/types/story";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import TextArea from "@/components/inputs/text-area";
import Button from "@/components/buttons/button";
import { modal } from "@/components/modal/modal.store";
import { snakeCaseToCapitalizeWord } from "@/utils/string";
import Link from "next/link";
import FullScreenLoading from "@/components/loadings/full-screen-loading";
import NationSelection from "@/components/selections/nation-selection";

export default function EditStory() {
  const params = useParams();
  const router = useRouter();

  const [isUpdating, setIsUpdating] = useState(false);
  const [story, setStory] = useState<Story | null>(null);
  const [coverArtFile, setCoverArtFile] = useState<File>();
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

  async function onConfirmUpdate() {
    const oldGenresSet = new Set(story?.genres);
    const newGenresSet = new Set(editedStory?.genres);
    const combineGenresSet = new Set([...oldGenresSet, ...newGenresSet]);

    modal.open("confirm", {
      title: "Xác nhận cập nhật thông tin",
      content: (
        <div className="max-w-[80vw] relative">
          <p>
            <span className="font-semibold">Tiêu đề : </span>
            {story?.title} ➜ {editedStory?.title}
          </p>
          <p>
            <span className="font-semibold">Quốc gia : </span>
            {[story?.nation?.flag_icon, story?.nation?.name].join(" ")} ➜ {[editedStory?.nation?.flag_icon, editedStory?.nation?.name].join(" ")}
          </p>
          <p>
            <span className="font-semibold">Trạng thái : </span>
            {snakeCaseToCapitalizeWord(story?.status ?? "")} ➜ {snakeCaseToCapitalizeWord(editedStory?.status ?? "")}
          </p>

          <div className="flex flex-row flex-wrap gap-x-1">
            <span className="font-semibold">Thể loại : </span>
            {[...combineGenresSet]?.map((genre, i) => (
              <p key={genre} className={`${!newGenresSet.has(genre) ? "text-red-500" : ""} ${!oldGenresSet.has(genre) ? "text-green-500" : ""}`}>
                {snakeCaseToCapitalizeWord(genre)}
                {i < combineGenresSet.size - 1 ? ", " : ""}
              </p>
            ))}
          </div>

          <p>
            <span className="font-semibold">Tóm tắt / Mô tả : </span>
            {story?.summary} ➜ {editedStory?.summary}
          </p>
        </div>
      ),
      onConfirm: async () => {
        if (!editedStory) return toast.message("Vui lòng đợi trong giây lát");

        setIsUpdating(true);
        const res = await adminService.updateStory(editedStory, coverArtFile);
        setIsUpdating(false);

        if (!res.success) return toast.warning(res.message);

        toast.message("Cập nhật thông tin truyện thành công");

        router.back();
      },
    });
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
      const next: Story = { ...prev, nation: { name: nation } };
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

  function setSummary(summary: string) {
    setEditedStory((prev) => {
      if (!prev) return prev;
      const next: Story = { ...prev, summary: summary };
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
    <div className="relative w-full h-screen">
      {loading ? (
        <Loading className="h-screen"></Loading>
      ) : (
        <div className="flex flex-col gap-5 w-full">
          <Link href={`/stories/${story?.type}/${story?.title}`} className="w-fit m-auto">
            <h2 className="font-semibold">{story?.title}</h2>
          </Link>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 ">
            <ImagePicker className="col-span-1" defaultValue={story?.cover_art.url} onChange={setCoverArtFile} onReset={() => {}}></ImagePicker>

            <div className="flex flex-col gap-2 w-full lg:col-span-2">
              <Input label="Title" placeHolder={story?.title} defaultValue={story?.title} onChange={setTitle} onReset={setTitle}></Input>
              <NationSelection
                defaultValue={story?.nation ? [story?.nation?.flag_icon, story?.nation?.name].join(" ") : null}
                onChange={(nation) => setNation(nation ?? "")}
              ></NationSelection>
              <StoryStatusSelection
                defaultValue={story?.status as TargetStoryStatus}
                onChange={(status) => setStoryStatus(status ?? "")}
              ></StoryStatusSelection>
              <StoryGenreMultiSelection defaultValue={story?.genres} onChange={setGenres}></StoryGenreMultiSelection>

              <TextArea label="Tóm tắt / Mô tả truyện" placeHolder={story?.summary} defaultValue={story?.summary} onChange={setSummary}></TextArea>
            </div>
          </div>

          <div>
            <Button className="font-semibold text-lg w-full" onClick={onConfirmUpdate}>
              Xác nhận
            </Button>
          </div>
        </div>
      )}

      {isUpdating && <FullScreenLoading label="Đang cập nhật, vui lòng đợi" />}
    </div>
  );
}
