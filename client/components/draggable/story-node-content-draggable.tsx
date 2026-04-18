import { StoryNodeContent } from "@/types/story-node";

import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";

import React, { useRef } from "react";
import RemoveIcon from "@/public/delete.svg";
import ReturnIcon from "@/public/return.svg";
import ImagePicker from "../inputs/image-picker";
import ResetIcon from "@/public/reset.svg";
import TextArea from "../inputs/text-area";

const StoryNodeContentDraggable = React.memo(function StoryNodeContentDraggable({
  id,
  content,
  className,

  onDelete,
  onDiscardDelete,
  onChange,
  onReset,

  onAddManyContent,
}: {
  id: number | string;
  content: StoryNodeContent;
  className?: string;

  onDelete?: (content?: StoryNodeContent) => void;
  onDiscardDelete?: (content?: StoryNodeContent) => void;

  onChange?: (content: StoryNodeContent) => void;
  onReset?: (content: StoryNodeContent) => void;

  onAddManyContent?: (contents: StoryNodeContent[]) => void;
}) {
  const { attributes, listeners, setNodeRef, transform, transition } = useSortable({ id });

  const styles: React.CSSProperties = {
    transition,
    transform: CSS.Transform.toString(transform),
  };

  const oldContent = useRef(content);

  const isEdited = useRef(false);

  function handleUpdateContent(newContent?: File | string) {
    if (content.type === "image") {
      if (typeof newContent === "string") {
        onChange?.({ ...content, type: "image", image: { url: newContent }, isEdited: isEdited.current });
      } else {
        onChange?.({ ...content, type: "image", imageFile: newContent, isEdited: isEdited.current });
      }
    } else {
      if (typeof newContent === "string") {
        onChange?.({ ...content, type: content.type ?? "text", content: newContent, isEdited: isEdited.current });
      }
    }
  }

  function handleResetContent() {
    isEdited.current = false;
    onReset?.(oldContent.current);
  }

  return (
    <div
      className={`flex flex-col justify-start items-center gap-1 
        bg-background-items rounded-sm p-1 shadow-md w-full border
        ${content.deleted_status !== "not_deleted" ? "border-red-500" : content.isNew ? "border-green-500" : content.isEdited ? "border-yellow-500" : "border-transparent"}
        ${className} `}
      ref={setNodeRef}
      {...attributes}
      style={styles}
    >
      <div className={` relative w-full flex flex-row gap-1 justify-between px-2`}>
        {content.isEdited ? <ResetIcon onClick={handleResetContent} className="w-4 h-4 text-foreground cursor-pointer" /> : <div className="w-4 h-4" />}

        <p {...listeners} className="w-full text-center text-md cursor-grab">
          {content.order_index.toString()}
        </p>

        {(content as StoryNodeContent).deleted_status !== "not_deleted" ? (
          <ReturnIcon onClick={() => onDiscardDelete?.(content)} className="w-4.5 h-4.5 absolute right-2 top-0 cursor-pointer" />
        ) : (
          <RemoveIcon onClick={() => onDelete?.(content)} className="w-5 h-5 absolute right-2 top-0 text-red-500 cursor-pointer" />
        )}
      </div>

      <div className={`h-full w-full ${content.deleted_status !== "not_deleted" ? "opacity-10" : ""} `}>
        {content.type === "image" && (
          <ImagePicker
            className="h-full w-full max-w-[500px] m-auto"
            disabled={content.deleted_status !== "not_deleted"}
            defaultValue={content.image?.url}
            value={content.image?.url ? content.imageFile : content.imageFile ? content.imageFile : ""}
            onSelectMultiImage={(images) => {
              onAddManyContent?.(
                images.map((image, i) => ({
                  type: "image",
                  imageFile: image,
                  story_node_id: content.story_node_id,
                  order_index: Number(content.order_index) + i + 1,
                  id: crypto.randomUUID(),
                  isDeleted: false,
                  isNew: true,
                })),
              );
            }}
            onChange={(file) => {
              isEdited.current = true;
              handleUpdateContent(file);
            }}
          />
        )}

        {content.type === "text" && (
          <div className="w-full h-full col-span-10">
            <p className="m-auto font-semibold">Text</p>
            <TextArea
              defaultValue={content.content ?? ""}
              onChange={(text) => {
                isEdited.current = true;
                handleUpdateContent(text);
              }}
              className="w-full h-full"
            />
          </div>
        )}

        {content.type === "title" && (
          <div className="w-full h-full col-span-10">
            <p className="m-auto font-semibold">Title</p>
            <TextArea
              defaultValue={content.content ?? ""}
              onChange={(text) => {
                isEdited.current = true;
                handleUpdateContent(text);
              }}
              className="w-full h-full"
            />
          </div>
        )}

        {content.type === "header" && (
          <div className="w-full h-full col-span-10">
            <p className="m-auto font-semibold">Header</p>
            <TextArea
              defaultValue={content.content ?? ""}
              onChange={(text) => {
                isEdited.current = true;
                handleUpdateContent(text);
              }}
              className="w-full h-full"
            />
          </div>
        )}
      </div>
    </div>
  );
});

export default StoryNodeContentDraggable;
