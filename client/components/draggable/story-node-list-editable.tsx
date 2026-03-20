import StoryNode from "@/types/story-node";
import { DndContext, DragAbortEvent, DragEndEvent, closestCorners } from "@dnd-kit/core";
import { arrayMove, SortableContext, verticalListSortingStrategy } from "@dnd-kit/sortable";
import React, { useCallback, useEffect, useRef, useState } from "react";
import StoryNodeEditable from "./story-node-editable";

import EditIcon from "@/public/edit/edit.svg";
import PlusIcon from "@/public/plus.svg";
import DeleteIcon from "@/public/delete.svg";
import ReturnIcon from "@/public/return.svg";

import ArrowDownIcon from "@/public/arrows/down-v.svg";
import { modal } from "../modal/modal.store";
import NumberInput from "../inputs/number-input";
import useAuth from "@/contexts/AuthContext";

export default function StoryNodeListEditable({
  storyId,
  storyNodes,
  onChange,
}: {
  storyId: string;
  storyNodes: StoryNode[];
  onChange?: (newStoryNode: StoryNode[]) => void;
}) {
  const auth = useAuth();

  const firstRender = useRef(true);

  const [nodes, setNodes] = useState<StoryNode[]>(storyNodes.map((node, i) => ({ ...node, is_deleted: false, is_new: false, is_edited: false, order: i })));

  const handleUpdateStoryNode = useCallback((newNode: StoryNode) => {
    if (!newNode) return;
    setNodes((prev) => {
      const newNodes = prev.map((node) => {
        if (node.id === newNode.id) return newNode;
        return node;
      });

      return newNodes;
    });
  }, []);

  function handleAddNewStoryNode() {
    let numberOfNewNodes: Record<string, number> = { arc: 0, volume: 0, chapter: 0 };

    modal.open("confirm", {
      content: (
        <div className="flex flex-col gap-2 w-full min-w-[300px] max-w-[80vw]">
          <div className="flex flex-col gap-2 justify-center items-start  ">
            <p className="text-xl font-semibold">Thêm mới children</p>
            <div className="flex flex-row flex-wrap gap-x-10 gap-y-3 p-4 shadow-[0px_4px_10px_rgb(0,0,0,0.2)] rounded-md">
              {/* Arc */}
              <div className="flex flex-row gap-2">
                <NumberInput
                  allowNegative={false}
                  allowNumeric={false}
                  defaultValue={numberOfNewNodes.arc}
                  onChange={(number) => {
                    numberOfNewNodes.arc = number;
                  }}
                />
                <p className="text-xl">Arc</p>
              </div>

              {/* Volume */}
              <div className="flex flex-row gap-2">
                <NumberInput
                  allowNegative={false}
                  allowNumeric={false}
                  defaultValue={numberOfNewNodes.volume}
                  onChange={(number) => {
                    numberOfNewNodes.volume = number;
                  }}
                />
                <p className="text-xl">Volume</p>
              </div>

              {/* Chapter */}
              <div className="flex flex-row gap-2">
                <NumberInput
                  allowNegative={false}
                  allowNumeric={false}
                  defaultValue={numberOfNewNodes.chapter}
                  onChange={(number) => {
                    numberOfNewNodes.chapter = number;
                  }}
                />
                <p className="text-xl">Chapter</p>
              </div>
            </div>
          </div>
        </div>
      ),
      onConfirm: () => {
        Object.keys(numberOfNewNodes).forEach((key, i) => {
          setNodes((prev) => {
            const newNodes = [...(prev ?? [])];
            Array.from({ length: numberOfNewNodes[key] }).forEach((_, i) => {
              newNodes.push({
                id: crypto.randomUUID(),
                type: key,
                order_index: (nodes?.length ?? 0) + i,
                story_id: storyId,
                poster_id: auth?.user?.id,
                is_new: true,
              });
            });

            return newNodes;
          });
        });

        modal.close();
      },
      onCancel: modal.close,
    });
  }

  useEffect(() => {
    if (firstRender.current) {
      firstRender.current = false;
      return;
    }

    onChange?.(nodes);
  }, [nodes]);

  return (
    <div className="flex flex-col gap-2">
      <div className="flex w-full justify-end ">
        <div
          onClick={handleAddNewStoryNode}
          className="px-5 py-1 cursor-pointer rounded-lg bg-foreground text-background-items flex flex-row justify-center items-center gap-2"
        >
          <PlusIcon className="w-6 h-6 shrink-0 cursor-pointer rounded-lg" />
          <p>Thêm mới</p>
        </div>
      </div>

      <div className="flex flex-col gap-2">
        {nodes && nodes.length > 0 && nodes?.map((node, i) => <StoryNodeEditable key={node.id} storyNode={node} onChange={handleUpdateStoryNode} />)}
      </div>
    </div>
  );
}
