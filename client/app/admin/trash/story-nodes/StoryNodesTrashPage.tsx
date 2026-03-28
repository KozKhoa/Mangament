"use client";

import Button from "@/components/buttons/button";
import NumberInput from "@/components/inputs/number-input";
import Loading from "@/components/loadings/loading";
import { loadingBar } from "@/components/loadings/loading-bar/top-loading-bar.store";
import SwitchPageSmall from "@/components/switch-page/small";
import { Pagination } from "@/types/pagination";
import StoryNode from "@/types/story-node";
import { useSearchParams } from "next/navigation";
import { useEffect, useMemo, useState } from "react";

import EyeIcon from "@/public/eye/open.svg";
import XICon from "@/public/x-icon.svg";
import ZoomIcon from "@/public/zooom.svg";
import TrashIcom from "@/public/trash.svg";
import adminService from "@/services/admin";

export default function StoryNodesTrashPage() {
  const searchParams = useSearchParams();

  const [storyNodes, setStoryNodes] = useState<StoryNode[]>([]);
  const [pagination, setPagination] = useState<Pagination>();
  const [loading, setLoading] = useState(false);
  const [deleting, setDeleting] = useState<Set<string>>(new Set());
  const [restoring, setRestoring] = useState<Set<string>>(new Set());
  const [selected, setSelected] = useState<Set<string>>(new Set());

  const page = useMemo(() => Number(searchParams.get("page") ?? 1), [searchParams]);
  const limit = useMemo(() => Number(searchParams.get("limit") ?? 20), [searchParams]);

  function handleSetlectedAll() {
    if (selected.size === storyNodes.length) {
      setSelected(new Set());
    } else {
      setSelected(new Set(storyNodes.map((storyNode) => storyNode.id ?? "")));
    }
    storyNodes;
  }

  async function handleDeleteTrashStoryNode(id: string) {
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

    toast.message("Xóa truyện vĩnh viễn thành công");
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
    loadingBar.close();
  }, []);

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
            {selected.size === storyNodes.length ? "Hủy chọn tất cả" : "Chọn tất cả"}
          </Button>
        </div>
      </div>

      {loading ? (
        <Loading className="w-full h-64" />
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-2.5">
          {storyNodes &&
            storyNodes.length > 0 &&
            storyNodes.map((storyNode, i) => (
              <div
                key={i}
                className={`border-4 relative rounded-lg overflow-hidden
                ${deleting.has(storyNode.id ?? "") ? "border-red-500 opacity-20" : restoring.has(story.id ?? "") ? "border-blue-500 opacity-20" : selected.has(story.id ?? "") ? "border-green-500" : "border-transparent"}
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
