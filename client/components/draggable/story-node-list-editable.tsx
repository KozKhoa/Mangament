import StoryNode from "@/types/story-node";

import { useCallback, useEffect, useRef, useState } from "react";
import StoryNodeEditable from "./story-node-editable";

import PlusIcon from "@/public/plus.svg";

import { modal } from "../modal/modal.store";
import NumberInput from "../inputs/number-input";
import useAuth from "@/contexts/AuthContext";
import Story from "@/types/story";
import Checkbox from "../inputs/checkbox";

export default function StoryNodeListEditable({
  story,
  storyNodes,
  onChange,
}: {
  story: Story;
  storyNodes: StoryNode[];
  onChange?: (newStoryNode: StoryNode[]) => void;
}) {
  const auth = useAuth();

  const firstRender = useRef(true);
  const isEditStoryNode = useRef(false);

  const [nodes, setNodes] = useState<StoryNode[]>(storyNodes);

  const [isShowDeleted, setIsShowDeleted] = useState(false);

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
        setNodes((prev) => {
          const newNodes = [...(prev ?? [])];
          Object.keys(numberOfNewNodes).forEach((key, i) => {
            Array.from({ length: numberOfNewNodes[key] }).forEach((_, j) => {
              newNodes.push({
                id: crypto.randomUUID(),
                type: key,
                order_index: (newNodes?.length ?? 0) + j,
                story_id: story.id,
                poster_id: auth?.user?.id,
                is_new: true,
              });
            });
          });

          return newNodes;
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

  useEffect(() => {
    if (!nodes || nodes.length <= 0) return;

    function editStoryNodeBeforeProcess(nodes: StoryNode[]): StoryNode[] {
      const newNodes = [...nodes];

      newNodes.forEach((node, i) => {
        node.order_index = i;
        node.is_deleted_before = node.deleted_status !== "not_deleted";
        node.is_new = false;
        node.is_edited = false;

        if (node.children && node.children.length > 0) {
          node.children = editStoryNodeBeforeProcess([...node.children]);
        }

        if (node.content && node.content.length > 0) {
          node.content.forEach((cont, i) => {
            cont.order_index = i;
            cont.is_deleted_before = cont.deleted_status !== "not_deleted";
            cont.isEdited = false;
            cont.isNew = false;
          });
        }
      });

      return newNodes;
    }

    if (isEditStoryNode.current === false) {
      setNodes((prev) => editStoryNodeBeforeProcess(prev));

      isEditStoryNode.current = true;
    }
  }, [nodes]);

  console.log(nodes);

  return (
    <div className="flex flex-col gap-2">
      <div className="flex w-full justify-end items-center gap-3">
        <div>
          <Checkbox value={isShowDeleted} onChange={(checked) => setIsShowDeleted(checked)}>
            Hiển thị phần tử đã bị xóa
          </Checkbox>
        </div>

        <div
          onClick={handleAddNewStoryNode}
          className="px-5 py-1 cursor-pointer rounded-lg bg-foreground text-background-items flex flex-row justify-center items-center gap-2"
        >
          <PlusIcon className="w-6 h-6 shrink-0 cursor-pointer rounded-lg" />
          <p>Thêm mới</p>
        </div>
      </div>

      <div className="flex flex-col gap-2">
        {nodes &&
          nodes.length > 0 &&
          nodes?.map((node, i) => {
            if (!isShowDeleted && node.deleted_status !== "not_deleted" && node.is_deleted_before === true) return null;
            return <StoryNodeEditable key={node.id} storyNode={node} story={story} onChange={handleUpdateStoryNode} isShowDeleted={isShowDeleted} />;
          })}
      </div>
    </div>
  );
}
