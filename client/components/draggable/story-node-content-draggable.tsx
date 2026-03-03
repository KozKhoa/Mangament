import { StoryNodeContent } from "@/types/story-node";

import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";

import React, { useRef } from "react";
import RemoveIcon from "@/public/delete.svg";
import ReturnIcon from "@/public/return.svg";
import ImagePicker from "../inputs/image-picker";
import ResetIcon from "@/public/reset.svg";

type Content = StoryNodeContent;

const StoryNodeContentDraggable = React.memo(function StoryNodeContentDraggable({
  id,
  content,
  className,
  onDelete,
  onDiscardDelete,
  onChange,
  onReset,
}: {
  id: number | string;
  content: Content;
  className?: string;

  onDelete?: (content?: Content) => void;
  onDiscardDelete?: (content?: Content) => void;

  onChange?: (content: Content) => void;
  onReset?: (content: Content) => void;
}) {
  const { attributes, listeners, setNodeRef, transform, transition } = useSortable({ id });

  const styles: React.CSSProperties = {
    transition,
    transform: CSS.Transform.toString(transform),
  };

  const oldContent = useRef(content);

  const isEdited = useRef(false);

  function handleUpdateContent(image?: File | string) {
    if (typeof image === "string") {
      onChange?.({ ...content, type: "image", image: { url: image }, isEdited: isEdited.current });
    } else {
      onChange?.({ ...content, type: "image", imageFile: image, isEdited: isEdited.current });
    }
  }

  function handleResetContent() {
    isEdited.current = false;
    onReset?.(oldContent.current);
  }

  return (
    <div
      className={`flex flex-col justify-start items-center gap-1 
        bg-background-items rounded-sm p-1 shadow-md w-full border-2
        ${content.isDeleted ? "border-red-500" : content.isNew ? "border-green-500" : content.isEdited ? "border-yellow-500" : "border-transparent"}
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

        {(content as Content).isDeleted ? (
          <ReturnIcon onClick={() => onDiscardDelete?.(content)} className="w-4.5 h-4.5 absolute right-2 top-0 cursor-pointer" />
        ) : (
          <RemoveIcon onClick={() => onDelete?.(content)} className="w-5 h-5 absolute right-2 top-0 text-red-500 cursor-pointer" />
        )}
      </div>

      <div className={`h-full ${content.isDeleted ? "opacity-10" : ""} `}>
        {content.type === "image" && (
          <ImagePicker
            className="h-full w-fit"
            disabled={content.isDeleted}
            defaultValue={content.image?.url}
            value={content.image?.url ? content.imageFile : content.imageFile ? content.imageFile : ""}
            onChange={(file) => {
              isEdited.current = true;

              handleUpdateContent(file);
            }}
          />
        )}
      </div>
    </div>
  );
});

export default StoryNodeContentDraggable;
