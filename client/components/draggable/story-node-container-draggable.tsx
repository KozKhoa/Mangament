import StoryNode from "@/types/story-node";
import { DndContext, DragAbortEvent, DragEndEvent, closestCorners } from "@dnd-kit/core";
import { arrayMove, SortableContext, verticalListSortingStrategy } from "@dnd-kit/sortable";
import React, { useCallback, useEffect, useRef, useState } from "react";
import StoryNodeDraggable from "./story-node-draggable";

export default function StoryNodeContainerDraggable({ storyNodes, onChange }: { storyNodes: StoryNode[]; onChange?: (newStoryNode: StoryNode[]) => void }) {
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

  useEffect(() => {
    if (firstRender.current) {
      firstRender.current = false;
      return;
    }

    onChange?.(nodes);
  }, [nodes]);

  return (
    <div>
      <div className="flex flex-col gap-2">
        {nodes &&
          nodes.length > 0 &&
          nodes?.map((node, i) => <StoryNodeDraggable key={node.id} storyNode={node} onChange={handleUpdateStoryNode}></StoryNodeDraggable>)}
      </div>
    </div>
  );
}
