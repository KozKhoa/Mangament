"use client";

import Button from "@/components/buttons/button";
import NumberInput from "@/components/inputs/number-input";
import Loading from "@/components/loadings/loading";
import { loadingBar } from "@/components/loadings/loading-bar/top-loading-bar.store";
import SwitchPageSmall from "@/components/switch-page/small";
import { Pagination } from "@/types/pagination";
import StoryNode from "@/types/story-node";
import { useRouter, useSearchParams } from "next/navigation";
import { MouseEvent, useMemo, useState } from "react";

import ZoomIcon from "@/public/zooom.svg";

import Checkbox from "@/components/inputs/checkbox";
import TrashStoryNodeCard from "@/components/cards/story-nodes/trash-story-node-card";
import NoContent from "@/components/cards/no-content";

interface StoryNodesTrashGridProps {
  storyNodes: StoryNode[];
  pagination?: Pagination;

  loading?: boolean;

  onRestoreMany?: (ids: string[]) => void;
  onDeleteMany?: (ids: string[]) => void;

  onRestore?: (id: string) => void;
  onDelete?: (id: string) => void;
}

export function StoryNodesTrashGrid({ storyNodes, pagination, loading, onRestoreMany, onDeleteMany, onRestore, onDelete }: StoryNodesTrashGridProps) {
  const searchParams = useSearchParams();
  const router = useRouter();

  const [deleting, setDeleting] = useState<Set<string>>(new Set());
  const [restoring, setRestoring] = useState<Set<string>>(new Set());
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [lastSelected, setLastSelected] = useState<string>("");

  const page = useMemo(() => Number(searchParams.get("page") ?? 1), [searchParams]);
  const limit = useMemo(() => Number(searchParams.get("limit") ?? 20), [searchParams]);

  function handleSetlectedAll() {
    if (selected.size === storyNodes.length) {
      setSelected(new Set());
    } else {
      setSelected(new Set(storyNodes.map((storyNode) => storyNode.id ?? "")));
    }
  }

  function handleToggleSelectedStoryNode(storyNodeId: string, event: MouseEvent) {
    function toggle(id: string) {
      if (newSet.has(id)) {
        newSet.delete(id);
      } else {
        newSet.add(id);
      }
    }

    const newSet = new Set(selected);

    if (event.shiftKey) {
      let startToToggle = false;
      let isReverseSelected = false;

      const storyNodeArr = [...storyNodes];

      for (const storyNode of storyNodeArr) {
        if (storyNode.id === lastSelected) startToToggle = true;

        if (storyNode.id === storyNodeId && startToToggle === false) {
          startToToggle = true;
          isReverseSelected = true;
        }

        if (startToToggle && storyNode.id !== lastSelected) toggle(storyNode.id ?? "");

        if (!isReverseSelected && storyNode.id === storyNodeId) {
          break;
        } else if (isReverseSelected && storyNode.id === lastSelected) {
          break;
        }
      }
    } else {
      toggle(storyNodeId);
    }

    setLastSelected(storyNodeId);
    setSelected(newSet);
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

    setRestoring(new Set());
    setDeleting(new Set());
    setSelected(new Set());

    router.push(`?${params.toString()}`);
  }

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
            delay={500}
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
                onClick={() => onDeleteMany?.([...selected])}
              >
                Xóa
              </Button>

              <Button
                isProcessing={restoring.size > 0}
                disable={deleting.size > 0 || restoring.size > 0}
                buttonType="add"
                className="font-semibold"
                onClick={() => onRestoreMany?.([...selected])}
              >
                Khôi phục
              </Button>
            </>
          )}

          <Button buttonType="default" isProcessing={deleting.size > 0} disable={deleting.size > 0} className="font-semibold" onClick={handleSetlectedAll}>
            {selected.size === storyNodes.length ? "Hủy chọn tất cả" : "Chọn tất cả"}
          </Button>
        </div>
      </div>

      {loading ? (
        <Loading className="w-full h-64" />
      ) : (
        <div>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6 gap-2">
            {storyNodes &&
              storyNodes.length > 0 &&
              storyNodes.map((storyNode, i) => (
                <div
                  key={i}
                  className={`border-4 relative rounded-lg overflow-hidden
                ${deleting.has(storyNode.id ?? "") ? "border-red-500 opacity-20" : restoring.has(storyNode.id ?? "") ? "border-blue-500 opacity-20" : selected.has(storyNode.id ?? "") ? "border-green-500" : "border-transparent"}
              `}
                >
                  <button
                    disabled={deleting.has(storyNode.id ?? "") || restoring.has(storyNode.id ?? "")}
                    className="absolute top-0 left-0 z-10 bg-background-items px-1 py-1 rounded-br-2xl cursor-pointer shadow-lg opacity-60 hover:opacity-100 transition-opacity"
                    // onClick={() => handleZoomStoryNode(storyNode)}
                  >
                    <ZoomIcon className="w-5 h-5 text-foreground" />
                  </button>

                  <button
                    disabled={deleting.has(storyNode.id ?? "") || restoring.has(storyNode.id ?? "")}
                    className="absolute top-0 right-0 z-20 p-2  cursor-pointer  transition-opacity"
                    onClick={(e) => handleToggleSelectedStoryNode(storyNode.id ?? "", e)}
                  >
                    <Checkbox value={selected.has(storyNode.id ?? "")} />
                  </button>

                  <TrashStoryNodeCard
                    className={`w-full h-full ${selected.has(storyNode.id ?? "") ? "opacity-60" : ""}`}
                    storyNode={storyNode}
                    disable={deleting.has(storyNode.id ?? "") || restoring.has(storyNode.id ?? "")}
                    onClick={(e) => handleToggleSelectedStoryNode(storyNode.id ?? "", e)}
                    onDelete={() => onDelete?.(storyNode.id ?? "")}
                    onRestore={() => onRestore?.(storyNode.id ?? "")}
                  />
                </div>
              ))}
          </div>
          {storyNodes.length === 0 && <NoContent className="m-auto" />}
        </div>
      )}
    </div>
  );
}
