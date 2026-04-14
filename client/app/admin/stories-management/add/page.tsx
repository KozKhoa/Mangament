"use client";

import Input from "@/components/inputs/input";
import ImagePicker from "@/components/inputs/image-picker";

import StoryGenreMultiSelection from "@/components/selections/story-genres-multi-selection";
import StoryStatusSelection from "@/components/selections/story-status-selection";
import adminService from "@/services/admin";
import Story from "@/types/story";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import TextArea from "@/components/inputs/text-area";
import Button from "@/components/buttons/button";
import { modal } from "@/components/modal/modal.store";
import { snakeCaseToCapitalizeWord } from "@/utils/string";

import FullScreenLoading from "@/components/loadings/full-screen-loading";
import NationSelection from "@/components/selections/nation-selection";

import StoryTypeSelection from "@/components/selections/story-type-selection";
import Nation from "@/types/nation";
import withAdmin from "@/hoc/withAdmin";
import { loadingBar } from "@/components/loadings/loading-bar/top-loading-bar.store";

import { OTHER_TITLES_SEPARATOR } from "@/constants/story";

export function AddNewStoryPage() {
  const router = useRouter();

  const [story, setStory] = useState<Story | null>(null);
  const [coverArtFile, setCoverArtFile] = useState<File>();
  const [isAdding, setIsAdding] = useState(false);

  // call api for adding new story
  async function handleAddNewStory() {
    if (!story) return toast.message("Vui lòng đợi trong giây lát");

    setIsAdding(true);
    const res = await adminService.addNewStory(story, coverArtFile);
    setIsAdding(false);

    if (!res.success) return toast.warning(res.message);

    toast.message(`Thêm truyện ${story.title} thành công`);

    router.back();
  }

  async function onConfirmAddNew() {
    modal.open("confirm", {
      title: "Xác nhận thêm truyện mới",
      content: (
        <div className="max-w-[80vw] min-w-[60vw] relative">
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
              <p key={genre}>
                {snakeCaseToCapitalizeWord(genre)}
                {i < (story.genres?.length ?? 0) - 1 ? ", " : ""}
              </p>
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
          toast.warning("Vui lòng nhập đầy đủ thông tin");
          return;
        }

        handleAddNewStory();
        modal.close();
      },

      onCancel: modal.close,
    });
  }

  function setTitle(title: string) {
    setStory((prev) => {
      const next: any = { ...prev, title: title };
      return next;
    });
  }

  function setNation(nation: Nation) {
    setStory((prev) => {
      const next: any = { ...prev, nation: nation };
      return next;
    });
  }

  function setStoryStatus(status: string) {
    setStory((prev) => {
      const next: any = { ...prev, status: status };
      return next;
    });
  }

  function setGenres(genres: string[]) {
    setStory((prev) => {
      const next: any = { ...prev, genres: genres };
      return next;
    });
  }

  function setSummary(summary: string) {
    setStory((prev) => {
      const next: any = { ...prev, summary: summary };
      return next;
    });
  }

  function setStoryType(type: string) {
    setStory((prev) => {
      const next: any = { ...prev, type: type };
      return next;
    });
  }

  function setOtherTitles(otherTitles: string) {
    setStory((prev) => {
      const next: any = { ...prev, other_titles: otherTitles.split(OTHER_TITLES_SEPARATOR) };
      return next;
    });
  }

  useEffect(() => {
    loadingBar.close();
  }, []);

  return (
    <div className="relative w-full ">
      <div className="flex flex-col gap-5 w-full">
        <h2 className="font-semibold text-center w-full">Thêm truyện mới</h2>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 ">
          {/* Cover art */}

          <ImagePicker className="col-span-1" onChange={(file) => setCoverArtFile(file as File)} labelForNoImage="Tải ảnh bìa" onReset={() => {}} />

          {/* Other info */}
          <div className="flex flex-col gap-2 w-full lg:col-span-2">
            <Input require={true} label="Title" placeHolder={story?.title} onChange={setTitle}></Input>
            <StoryTypeSelection require={true} onChange={(type) => setStoryType(type ?? "")}></StoryTypeSelection>
            <StoryStatusSelection require={true} onChange={(status) => setStoryStatus(status ?? "")}></StoryStatusSelection>
            <NationSelection onChange={(nation) => setNation({ name: nation?.name ?? "", flag_icon: nation?.flag_icon })}></NationSelection>
            <StoryGenreMultiSelection onChange={setGenres}></StoryGenreMultiSelection>

            <TextArea label="Các tên gọi khác" placeHolder={`Các tên cách nhau bởi dấu chấm phẩy ";"`} onChange={setOtherTitles} />

            <TextArea label="Tóm tắt / Mô tả truyện" placeHolder={story?.summary} onChange={setSummary}></TextArea>
          </div>
        </div>

        <div>
          <Button buttonType="default" className="font-semibold text-lg w-full" onClick={onConfirmAddNew}>
            Thêm mới
          </Button>
        </div>
      </div>

      {isAdding && <FullScreenLoading label="Đang thêm mới, vui lòng đợi" />}
    </div>
  );
}

export default withAdmin(AddNewStoryPage);
