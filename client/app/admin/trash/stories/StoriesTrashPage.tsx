"use client";

import Image from "next/image";
import { toast } from "sonner";
import { useRouter, useSearchParams } from "next/navigation";
import { MouseEvent, useEffect, useMemo, useState } from "react";

import withAdmin from "@/hoc/withAdmin";
import { modal } from "@/components/modal/modal.store";

import EyeIcon from "@/public/eye/open.svg";
import XICon from "@/public/x-icon.svg";
import ZoomIcon from "@/public/zooom.svg";
import TrashIcom from "@/public/trash.svg";

import adminService from "@/services/admin";

import { Pagination } from "@/types/pagination";

import Button from "@/components/buttons/button";
import Loading from "@/components/loadings/loading";
import Checkbox from "@/components/inputs/checkbox";
import SwitchPageBig from "@/components/switch-page/big";
import NumberInput from "@/components/inputs/number-input";
import SwitchPageSmall from "@/components/switch-page/small";

import Story from "@/types/story";
import { snakeCaseToCapitalizeWord } from "@/utils/string";
import TrashStoryCard from "@/components/cards/stories/trash-story-card";
import DisplayStar from "@/components/displays/ratings/display-star";
import { beautifulView } from "@/utils/beautiful";
import { loadingBar } from "@/components/loadings/loading-bar/top-loading-bar.store";

export function StoriesTrashPage() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const page = useMemo(() => Number(searchParams.get("page") ?? 1), [searchParams]);
  const limit = useMemo(() => Number(searchParams.get("limit") ?? 20), [searchParams]);

  const [loading, setLoading] = useState(true);
  const [lastSelected, setLastSelected] = useState<string>("");
  const [deleting, setDeleting] = useState<Set<string>>(new Set());
  const [restoring, setRestoring] = useState<Set<string>>(new Set());
  const [selected, setSelected] = useState<Set<string>>(new Set());

  const [pagination, setPagination] = useState<Pagination>();
  const [stories, setStories] = useState<Story[]>([]);

  async function fetchTrashStories() {
    const res = await adminService.getAllTrashStories({ page, limit });
    setLoading(false);

    setStories(res.data ?? []);
    setPagination(res.pagination);
  }

  function handleSetlectedAll() {
    if (selected.size === stories.length) {
      setSelected(new Set());
    } else {
      setSelected(new Set(stories.map((story) => story.id ?? "")));
    }
  }

  async function handleRestoreStory(id: string) {
    if (!id) return;

    setRestoring((prev) => {
      const newSet = new Set(prev);
      newSet.add(id);
      return newSet;
    });

    const res = await adminService.restoreStory(id);

    setRestoring((prev) => {
      const newSet = new Set(prev);
      newSet.delete(id);
      return newSet;
    });

    if (!res.success) return toast.warning(res.message);

    setStories((prev) => prev.filter((story) => story.id !== id));

    fetchTrashStories();

    toast.message("Khôi phục thành công");
  }

  async function handleRestoreManyStories(ids: string[]) {
    if (!ids || ids.length <= 0) return;

    setRestoring((prev) => {
      const newSet = new Set(prev);
      ids.forEach((id) => newSet.add(id));
      return newSet;
    });

    const res = await adminService.restoreManyStories(ids);

    setRestoring((prev) => {
      const newSet = new Set(prev);
      ids.forEach((id) => newSet.delete(id));
      return newSet;
    });

    if (!res.success) return toast.warning(res.message);

    setStories((prev) => {
      const removed = new Set(ids);
      return prev.filter((story) => !removed.has(story.id ?? ""));
    });

    fetchTrashStories();

    toast.message("Khôi phục nhiều truyện thành công");
  }

  async function handleDeleteTrashStory(id: string) {
    if (!id) return;

    setDeleting((prev) => {
      const newSet = new Set(prev);
      newSet.add(id ?? "");
      return newSet;
    });

    const res = await adminService.deletePermanentTrashStory(id);

    setDeleting((prev) => {
      const newSet = new Set(prev);
      newSet.delete(id ?? "");
      return newSet;
    });

    if (!res.success) return toast.warning(res.message);

    setStories((prev) => prev.filter((story) => story.id !== id));

    fetchTrashStories();

    toast.message("Đã thêm vào hàng đợi xóa vĩnh viễn");
  }

  async function handleDeleteManyTrashStories(ids: string[]) {
    if (!ids || ids.length <= 0) return;

    setDeleting((prev) => {
      const newSet = new Set(prev);
      ids.forEach((id) => newSet.add(id));
      return newSet;
    });

    const res = await adminService.deletePermanentManyTrashStories(ids);

    if (!res.success) return toast.warning(res.message);

    setDeleting(new Set());

    setStories((prev) => {
      const removed = new Set(ids);
      return prev.filter((story) => !removed.has(story.id ?? ""));
    });

    fetchTrashStories();

    toast.message("Xóa vĩnh viễn truyện nhiều thành công");
  }

  function handleToggleSelectedStory(storyId: string, event: MouseEvent<HTMLButtonElement>) {
    function toggle(id: string) {
      if (selected.has(id)) {
        newSet.delete(id);
      } else {
        newSet.add(id);
      }
    }

    const newSet = new Set(selected);

    if (event.shiftKey) {
      let startToToggle = false;
      let isReverseSelected = false;

      const storyArr = [...stories];

      for (const story of storyArr) {
        if (story.id === lastSelected) startToToggle = true;

        if (story.id === storyId && startToToggle === false) {
          startToToggle = true;
          isReverseSelected = true;
        }

        if (startToToggle && story.id !== lastSelected) toggle(story.id ?? "");

        if (!isReverseSelected && story.id === storyId) {
          break;
        } else if (isReverseSelected && story.id === lastSelected) {
          break;
        }
      }
    } else {
      toggle(storyId);
    }

    setLastSelected(storyId);
    setSelected(newSet);
  }

  function handleZoomStory(story: Story) {
    modal.open("custom", {
      content: (
        <div className="min-w-[350px] w-[80vw] h-[90vh] relative flex flex-col gap-1">
          <div className="relative w-full h-full">
            <Image src={[process.env.NEXT_PUBLIC_CDN_URL, story.cover_art?.key].join("/")} className="object-contain m-auto" alt="Cover Art" fill />
          </div>

          {/* Title */}
          <p className="font-semibold text-xl">
            <span className="text-foreground/60">{"[" + snakeCaseToCapitalizeWord(story?.type ?? "") + "] "}</span> {story?.title}
          </p>

          {/* View */}
          <div className="flex flex-row justify-star items-center gap-x-1 px-1 rounded-tl-md bg-background-items">
            <EyeIcon className="w-5 h-5"></EyeIcon>
            <p className="italic font-semibold text-[0.8em]">{beautifulView(story?.view || 0)}</p>
          </div>

          {/* Rating */}
          <div className="flex flex-wrap gap-x-2.5 justify-start items-center">
            <div className="flex  justify-center items-center gap-1">
              <div className="flex justify-center items-center">
                <DisplayStar rating={story?.star || 0}></DisplayStar>
              </div>
              <p>{Math.round((story?.star ?? 0) * 10) / 10}</p>
            </div>
          </div>

          <XICon className="w-6 h-6 text-foreground/80 absolute top-0 right-0 cursor-pointer" onClick={modal.close} />
          <TrashIcom
            className="w-6 h-6 text-red-500 stroke-2 absolute top-0 left-0 cursor-pointer"
            onClick={() => {
              modal.close();
              handleDeleteTrashStory(story.id);
            }}
          />
        </div>
      ),

      onClickOutside: modal.close,
    });
  }

  function handleNavigate(key: string, value: number) {
    loadingBar.open({});
    const params = new URLSearchParams(searchParams.toString());

    params.set("page", "1");

    if (!key) {
      params.delete(key);
    } else {
      params.set(key, value.toString());
    }

    setLoading(true);

    setRestoring(new Set());
    setDeleting(new Set());
    setSelected(new Set());

    router.push(`?${params.toString()}`);
  }

  useEffect(() => {
    fetchTrashStories();

    loadingBar.close();
  }, [searchParams]);

  return (
    <div>
      <div className="flex flex-row flex-wrap my-2">
        <SwitchPageSmall
          className="min-w-[180px]"
          maxPage={pagination?.totalPages ?? 0}
          page={page}
          onChange={(pageIndex) => handleNavigate("page", pageIndex)}
        />

        <div className="mx-2 w-fit">
          <p className="my-1">Page Size</p>
          <NumberInput
            className="bg-background-items"
            allowNegative={false}
            allowNumeric={false}
            value={limit}
            onChange={(value) => handleNavigate("limit", value)}
          />
        </div>

        <div className="flex flex-row flex-wrap gap-2 items-center p-2 ml-auto ">
          {selected.size > 0 && (
            <>
              <Button
                isProcessing={deleting.size > 0}
                disable={deleting.size > 0}
                buttonType="delete"
                className="font-semibold"
                onClick={() => handleDeleteManyTrashStories([...selected])}
              >
                Xóa
              </Button>

              <Button
                isProcessing={deleting.size > 0}
                disable={deleting.size > 0}
                buttonType="add"
                className="font-semibold"
                onClick={() => handleRestoreManyStories([...selected])}
              >
                Khôi phục
              </Button>
            </>
          )}

          <Button isProcessing={deleting.size > 0} disable={deleting.size > 0} className="font-semibold" onClick={handleSetlectedAll}>
            {selected.size === stories.length ? "Hủy chọn tất cả" : "Chọn tất cả"}
          </Button>
        </div>
      </div>

      {loading ? (
        <Loading className="w-full h-64" />
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-2.5">
          {stories &&
            stories.length > 0 &&
            stories.map((story, i) => (
              <div
                key={i}
                className={`border-4 relative rounded-lg overflow-hidden
                ${deleting.has(story.id ?? "") ? "border-red-500 opacity-20" : restoring.has(story.id ?? "") ? "border-blue-500 opacity-20" : selected.has(story.id ?? "") ? "border-green-500" : "border-transparent"}
              `}
              >
                <button
                  disabled={deleting.has(story.id) || restoring.has(story.id)}
                  className="absolute top-0 left-0 z-10 bg-background-items px-1 py-2 rounded-b-full cursor-pointer shadow-lg"
                  onClick={() => handleZoomStory(story)}
                >
                  <ZoomIcon className="w-7 h-7 text-foreground" />
                </button>

                <button
                  disabled={deleting.has(story.id) || restoring.has(story.id)}
                  className="absolute top-0 right-0 z-10 p-2 bg-background-items px-1 py-2 rounded-b-full cursor-pointer shadow-lg"
                  onClick={(e) => handleToggleSelectedStory(story.id, e as any)}
                >
                  <Checkbox value={selected.has(story.id ?? "")} />
                </button>

                {/* Story */}
                <TrashStoryCard
                  className={`w-full h-full ${selected.has(story.id) ? "opacity-40" : ""}`}
                  story={story}
                  disable={deleting.has(story.id) || restoring.has(story.id)}
                  onClick={(e) => handleToggleSelectedStory(story.id, e as any)}
                  onDelete={() => handleDeleteTrashStory(story.id)}
                  onRestore={() => handleRestoreStory(story.id)}
                />
              </div>
            ))}
        </div>
      )}

      <SwitchPageBig className="m-auto my-5" maxPage={pagination?.totalPages ?? 0} page={page} onChange={(pageIndex) => handleNavigate("page", pageIndex)} />
    </div>
  );
}

export default withAdmin(StoriesTrashPage);
