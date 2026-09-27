"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

import Input from "@/components/inputs/input";
import ImagePicker from "@/components/inputs/image-picker";
import StoryGenreMultiSelection from "@/components/selections/story-genres-multi-selection";
import StoryStatusSelection from "@/components/selections/story-status-selection";
import NationSelection from "@/components/selections/nation-selection";
import StoryTypeSelection from "@/components/selections/story-type-selection";
import TextArea from "@/components/inputs/text-area";
import Button from "@/components/buttons/button";
import FullScreenLoading from "@/components/loadings/full-screen-loading";
import { modal } from "@/components/modal/modal.store";
import adminService from "@/services/admin";
import Story from "@/types/story";
import Nation from "@/types/nation";
import { snakeCaseToCapitalizeWord } from "@/utils/string";
import { OTHER_TITLES_SEPARATOR } from "@/constants/story";

export default function ManualStoryForm() {
  const router = useRouter();

  const [story, setStory] = useState<Story | null>(null);
  const [coverArtFile, setCoverArtFile] = useState<File>();
  const [isAdding, setIsAdding] = useState(false);

  // Gọi API thêm truyện mới thủ công
  async function handleAddNewStory() {
    if (!story) return toast.message("Vui lòng đợi trong giây lát");

    setIsAdding(true);
    const res = await adminService.addNewStory(story, coverArtFile);
    setIsAdding(false);

    if (!res.success) return toast.warning(res.message);

    toast.success(`Thêm truyện ${story.title} thành công`);
    router.back();
  }

  function onConfirmAddNew() {
    modal.open("confirm", {
      title: "Xác nhận thêm truyện mới",
      content: (
        <div className="max-w-[80vw] min-w-[60vw] relative text-sm space-y-2">
          <p>
            <span className="font-semibold">Tiêu đề : </span>
            {story?.title}
          </p>
          <p>
            <span className="font-semibold">Quốc gia : </span>
            {[story?.nation?.flag_icon, story?.nation?.name].join(" ")}
          </p>
          <p>
            <span className="font-semibold">Trạng thái : </span>
            {snakeCaseToCapitalizeWord(story?.status ?? "")}
          </p>

          <div className="flex flex-row flex-wrap gap-x-1">
            <span className="font-semibold">Thể loại : </span>
            {story?.genres?.map((genre, i) => (
              <span key={genre}>
                {snakeCaseToCapitalizeWord(genre)}
                {i < (story.genres?.length ?? 0) - 1 ? ", " : ""}
              </span>
            ))}
          </div>

          <p>
            <span className="font-semibold">Tóm tắt / Mô tả : </span>
            {story?.summary}
          </p>
        </div>
      ),
      onConfirm: () => {
        if (!story?.title || !story?.status || !story?.type) {
          toast.warning("Vui lòng nhập đầy đủ thông tin bắt buộc (Tiêu đề, Loại truyện, Trạng thái)");
          return;
        }

        handleAddNewStory();
        modal.close();
      },
      onCancel: modal.close,
    });
  }

  function setTitle(title: string) {
    setStory((prev) => ({ ...(prev as Story), title }));
  }

  function setNation(nation: Nation) {
    setStory((prev) => ({ ...(prev as Story), nation }));
  }

  function setStoryStatus(status: string) {
    setStory((prev) => ({ ...(prev as Story), status }));
  }

  function setGenres(genres: string[]) {
    setStory((prev) => ({ ...(prev as Story), genres }));
  }

  function setSummary(summary: string) {
    setStory((prev) => ({ ...(prev as Story), summary }));
  }

  function setStoryType(type: string) {
    setStory((prev) => ({ ...(prev as Story), type }));
  }

  function setOtherTitles(otherTitles: string) {
    setStory((prev) => ({ ...(prev as Story), other_titles: otherTitles.split(OTHER_TITLES_SEPARATOR) }));
  }

  return (
    <div className="relative w-full">
      <div className="flex flex-col gap-6 w-full">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {/* Cover art */}
          <div className="col-span-1 flex flex-col gap-2">
            <label className="text-sm font-semibold">Ảnh bìa truyện</label>
            <ImagePicker
              className="w-full"
              onChange={(file) => setCoverArtFile(file as File)}
              labelForNoImage="Tải ảnh bìa"
              onReset={() => setCoverArtFile(undefined)}
            />
          </div>

          {/* Other info */}
          <div className="flex flex-col gap-3 w-full lg:col-span-2">
            <Input require={true} label="Tiêu đề truyện" placeHolder={story?.title} onChange={setTitle} />
            <StoryTypeSelection require={true} onChange={(type) => setStoryType(type ?? "")} />
            <StoryStatusSelection require={true} onChange={(status) => setStoryStatus(status ?? "")} />
            <NationSelection onChange={(nation) => setNation({ name: nation?.name ?? "", flag_icon: nation?.flag_icon })} />
            <StoryGenreMultiSelection onChange={setGenres} />

            <TextArea label="Các tên gọi khác" placeHolder={`Các tên cách nhau bởi dấu chấm phẩy "${OTHER_TITLES_SEPARATOR}"`} onChange={setOtherTitles} />

            <TextArea label="Tóm tắt / Mô tả truyện" placeHolder={story?.summary} onChange={setSummary} />
          </div>
        </div>

        <div className="pt-4 border-t border-border">
          <Button buttonType="default" className="font-semibold text-lg w-full py-2.5" onClick={onConfirmAddNew}>
            Thêm truyện mới
          </Button>
        </div>
      </div>

      {isAdding && <FullScreenLoading label="Đang thêm truyện, vui lòng đợi..." />}
    </div>
  );
}
