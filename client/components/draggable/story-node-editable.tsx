import StoryNode, { StoryNodeContent } from "@/types/story-node";
import { snakeCaseToCapitalizeWord } from "@/utils/string";

import { DndContext, DragEndEvent, closestCorners } from "@dnd-kit/core";
import { arrayMove, rectSortingStrategy, SortableContext } from "@dnd-kit/sortable";

import React, { useCallback, useState } from "react";

import EditIcon from "@/public/edit/edit.svg";
import PlusIcon from "@/public/plus.svg";
import DeleteIcon from "@/public/delete.svg";
import ReturnIcon from "@/public/return.svg";

import ArrowDownIcon from "@/public/arrows/down-v.svg";
import StoryNodeContentDraggable from "./story-node-content-draggable";

import { modal } from "../modal/modal.store";

import Input from "../inputs/input";

import StoryNodeTypeSelection, { TargetStoryNodeType } from "../selections/story-node-type-selection";

import useAuth from "@/contexts/AuthContext";

import NumberInput from "../inputs/number-input";
import Story from "@/types/story";

const StoryNodeEditable = React.memo(function StoryNodeEditable({
  storyNode,
  story,
  onChange,
}: {
  storyNode: StoryNode;
  story?: Story;
  onChange?: (newStoryNode: StoryNode) => void;
}) {
  const auth = useAuth();

  const [open, setOpen] = useState(false);

  function handleUpdateStoryNode() {
    let editedNode: StoryNode = { ...storyNode };

    modal.open("confirm", {
      title: `Thay đổi thông tin ${storyNode.type} ${storyNode.order_index}`,
      content: (
        <div className="min-w-[350px] max-w-[2000px] w-[80vw] flex flex-col gap-2">
          <div className="flex flex-col gap-1">
            <p className="font-semibold">Order index</p>
            <NumberInput
              allowNegative={false}
              defaultValue={storyNode.order_index}
              onChange={(value) => {
                editedNode.order_index = value;
              }}
            ></NumberInput>
          </div>
          <Input
            label="Tiêu đề"
            defaultValue={storyNode.title}
            onChange={(title) => {
              editedNode.title = title;
            }}
          />
          <StoryNodeTypeSelection
            defaultValue={storyNode.type as TargetStoryNodeType}
            onChange={(type) => {
              editedNode.type = type ?? "";
            }}
          />
        </div>
      ),
      onConfirm: () => {
        if (editedNode === storyNode) {
          editedNode.is_edited = false;
          return;
        }

        editedNode.is_edited = true;

        onChange?.(editedNode);
        modal.close();
      },
      onCancel: () => {
        modal.close();
      },
    });
  }

  function handleSortContent(event: DragEndEvent) {
    const { active, over } = event;

    if (active.id === over?.id) return;

    const content = [...(storyNode.content ?? [])];

    if (!content) return content;

    const oldPos = content.findIndex((cont) => cont.id === active.id);
    const newPos = content.findIndex((cont) => cont.id === over?.id);

    onChange?.({ ...storyNode, content: arrayMove(content, oldPos, newPos), is_edited: true });
  }

  const handleDeleteContent = useCallback(
    (content?: StoryNodeContent) => {
      if (!content) return;

      if (content.isNew && !(content.content || content.image || content.imageFile)) {
        onChange?.({ ...storyNode, content: storyNode.content?.filter((cont) => cont.id !== content.id), is_edited: true });
      } else {
        onChange?.({
          ...storyNode,
          content: storyNode?.content?.map((cont) => {
            if (cont.id === content.id) cont.isDeleted = true;
            return cont;
          }),
          is_edited: true,
        });
      }
    },
    [storyNode],
  );

  const handleDiscardDeleteContent = useCallback(
    (content?: StoryNodeContent) => {
      if (!content) return;

      onChange?.({
        ...storyNode,
        content: storyNode.content?.map((cont) => {
          if (cont.id === content.id) cont.isDeleted = false;
          return cont;
        }),
      });
    },
    [storyNode],
  );

  const handleUpdateContent = useCallback(
    (content: StoryNodeContent) => {
      onChange?.({
        ...storyNode,
        content: storyNode.content?.map((cont) => {
          if (cont.id === content.id) {
            return content;
          }
          return cont;
        }),
        is_edited: true,
      });
    },
    [storyNode],
  );

  const handleUpdateChild = useCallback(
    (newChild: StoryNode) => {
      onChange?.({
        ...storyNode,
        children: storyNode.children?.map((child) => {
          if (child.id === newChild.id) {
            return newChild;
          }
          return child;
        }),
      });
    },
    [storyNode, onChange],
  );

  function handleToggleDeleteItSelf(isDeleted: boolean) {
    setOpen(false);
    onChange?.({ ...storyNode, is_deleted: isDeleted, is_edited: true });
  }

  const handleAddManyContent = useCallback(
    (contents: StoryNodeContent[]) => {
      const newContent = [...(storyNode.content ?? []), ...contents.map((content) => ({ ...content, isNew: true }))];
      onChange?.({ ...storyNode, content: newContent });
    },
    [storyNode],
  );

  function handleAddNewThings() {
    let numberOfContent: Record<string, number> = { image: 0, title: 0, header: 0, text: 0 };

    let numberOfNewChildren: Record<string, number> = { arc: 0, volume: 0, chapter: 0 };

    modal.open("confirm", {
      content: (
        <div className="flex flex-col gap-2 w-full min-w-[300px] max-w-[80vw]">
          <div className="flex flex-col gap-2 justify-center items-start  ">
            <p className="text-xl font-semibold">Thêm mới children</p>
            {/* Arc */}
            <div className="flex flex-row flex-wrap gap-x-10 gap-y-3 p-4 shadow-[0px_4px_10px_rgb(0,0,0,0.2)] rounded-md">
              <div className="flex flex-row gap-2">
                <NumberInput
                  allowNegative={false}
                  allowNumeric={false}
                  defaultValue={numberOfNewChildren.arc}
                  onChange={(number) => {
                    numberOfNewChildren.arc = number;
                  }}
                />
                <p className="text-xl">Arc</p>
              </div>

              {/* Volume */}
              <div className="flex flex-row gap-2">
                <NumberInput
                  allowNegative={false}
                  allowNumeric={false}
                  defaultValue={numberOfNewChildren.volume}
                  onChange={(number) => {
                    numberOfNewChildren.volume = number;
                  }}
                />
                <p className="text-xl">Volume</p>
              </div>

              {/* Chapter */}
              <div className="flex flex-row gap-2">
                <NumberInput
                  allowNegative={false}
                  allowNumeric={false}
                  defaultValue={numberOfNewChildren.chapter}
                  onChange={(number) => {
                    numberOfNewChildren.chapter = number;
                  }}
                />
                <p className="text-xl">Chapter</p>
              </div>
            </div>
          </div>

          <div className="flex flex-col gap-2 justify-center item">
            <p className="text-xl font-semibold">Thêm mới content</p>

            <div className="flex flex-row flex-wrap gap-2">
              {/* Image */}
              <div className="flex flex-row gap-2 p-4 shadow-[0px_4px_10px_rgb(0,0,0,0.2)] rounded-md">
                <NumberInput
                  allowNegative={false}
                  allowNumeric={false}
                  defaultValue={numberOfContent.image ?? 0}
                  onChange={(number) => (numberOfContent.image = number)}
                />

                <p className="text-xl">Ảnh</p>
              </div>

              {/* Title */}
              <div className="flex flex-row gap-2 p-4 shadow-[0px_4px_10px_rgb(0,0,0,0.2)] rounded-md">
                <NumberInput
                  allowNegative={false}
                  allowNumeric={false}
                  defaultValue={numberOfContent.title ?? 0}
                  onChange={(number) => (numberOfContent.title = number)}
                />

                <p className="text-xl">Title</p>
              </div>

              {/* Header */}
              <div className="flex flex-row gap-2 p-4 shadow-[0px_4px_10px_rgb(0,0,0,0.2)] rounded-md">
                <NumberInput
                  allowNegative={false}
                  allowNumeric={false}
                  defaultValue={numberOfContent.header ?? 0}
                  onChange={(number) => (numberOfContent.header = number)}
                />

                <p className="text-xl">Header</p>
              </div>

              {/* Text */}
              <div className="flex flex-row gap-2 p-4 shadow-[0px_4px_10px_rgb(0,0,0,0.2)] rounded-md">
                <NumberInput
                  allowNegative={false}
                  allowNumeric={false}
                  defaultValue={numberOfContent.text ?? 0}
                  onChange={(number) => (numberOfContent.text = number)}
                />

                <p className="text-xl">Text</p>
              </div>
            </div>
          </div>
        </div>
      ),
      onConfirm: () => {
        const newContent = [...(storyNode.content ?? [])];
        const newChildren = [...(storyNode.children ?? [])];

        Object.keys(numberOfContent).forEach((key, i) => {
          const number = numberOfContent[key] ?? 0;

          if (number > 0) {
            Array.from({ length: number }).forEach((_, i) => {
              newContent.push({
                type: key,
                story_node_id: storyNode.id,
                order_index: (storyNode.content?.length ?? 0) + i,
                id: crypto.randomUUID(),
                isDeleted: false,
                isNew: true,
              });
            });
          }
        });

        Object.keys(numberOfNewChildren).forEach((key, i) => {
          const number = numberOfNewChildren[key] ?? 0;

          if (number > 0) {
            Array.from({ length: number }).forEach((_, i) => {
              newChildren.push({
                id: crypto.randomUUID(),
                type: key,
                order_index: (storyNode.children?.length ?? 0) + i,
                story_id: storyNode.story_id,
                parent_id: storyNode.id,
                poster_id: auth?.user?.id,
                is_new: true,
              });
            });
          }
        });

        onChange?.({ ...storyNode, content: newContent, children: newChildren, is_edited: true });

        setOpen(true);

        modal.close();
      },
      onCancel: modal.close,
    });
  }

  return (
    <div className={`flex flex-col gap-2 `}>
      <div
        className={`flex gap-0.5 items-center justify-between bg-background-items
            px-3 py-2 border rounded-sm min-h-10.5 
            ${storyNode.is_deleted ? "border-red-500 opacity-20" : storyNode.is_new ? "border-green-500" : storyNode.is_edited ? "border-yellow-500" : "border-transparent"}`}
      >
        <div className="flex flex-row  items-center gap-2 w-full ">
          <div className="flex justify-center items-center min-w-10 min-h-10 px-1 bg-foreground/20 rounded-sm">
            <p className="font-semibold text-lg">{storyNode.order_index}</p>
          </div>

          <div>
            {snakeCaseToCapitalizeWord(storyNode.type)} <span className="">{storyNode.order_index}</span> : {storyNode.title}
          </div>

          <div>
            {storyNode.children?.length} - {storyNode.content?.length}
          </div>
        </div>

        <div className="flex flex-row gap-4 justify-center items-center px-2 cursor-pointer">
          {storyNode.is_deleted ? (
            <ReturnIcon onClick={() => handleToggleDeleteItSelf(false)} className="w-6 h-6 shrink-0" />
          ) : (
            <DeleteIcon onClick={() => handleToggleDeleteItSelf(true)} className="w-6 h-6 shrink-0 text-red-500" />
          )}

          <button disabled={storyNode.is_deleted} className={`flex flex-row gap-4 justify-center items-center ${storyNode.is_deleted ? "" : "cursor-pointer"}`}>
            <PlusIcon onClick={handleAddNewThings} className="w-6 h-6 shrink-0" />

            <EditIcon onClick={handleUpdateStoryNode} className="w-5 h-5  shrink-0"></EditIcon>

            <ArrowDownIcon
              onClick={() => setOpen(!open)}
              className={`w-4 h-4 fill-foreground duration-100 shrink-0 ${open ? "rotate-180" : "rotate-0"}`}
            ></ArrowDownIcon>
          </button>
        </div>
      </div>

      {open && (
        <div className={`flex flex-col gap-2 w-full h-fit px-5 lg:px-10`}>
          <div className="w-full">
            <div className="flex flex-col gap-2">
              {storyNode.children &&
                storyNode.children.length > 0 &&
                storyNode.children?.map((child, i) => <StoryNodeEditable key={child.id} storyNode={child} story={story} onChange={handleUpdateChild} />)}
            </div>
          </div>
          <div>
            {storyNode.content && storyNode.content.length > 0 && (
              <DndContext collisionDetection={closestCorners} onDragEnd={handleSortContent}>
                <SortableContext items={storyNode.content} strategy={rectSortingStrategy}>
                  <div
                    className={`${story?.type === "light_novel" ? "flex flex-col gap-2" : "grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-2 w-full"}`}
                  >
                    {storyNode.content?.map((content, i) => {
                      return (
                        <StoryNodeContentDraggable
                          className={`${content.type === "image" ? "" : "col-span-10"}`}
                          onDelete={handleDeleteContent}
                          onDiscardDelete={handleDiscardDeleteContent}
                          onChange={handleUpdateContent}
                          onReset={handleUpdateContent}
                          onAddManyContent={handleAddManyContent}
                          key={content.id}
                          id={content.id}
                          content={content}
                        ></StoryNodeContentDraggable>
                      );
                    })}
                  </div>
                </SortableContext>
              </DndContext>
            )}
          </div>
        </div>
      )}
    </div>
  );
});

export default StoryNodeEditable;
