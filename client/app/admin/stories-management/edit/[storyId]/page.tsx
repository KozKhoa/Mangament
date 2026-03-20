"use client";

import { TargetStoryStatus } from "@/components/selections/story-status-selection";
import Input from "@/components/inputs/input";
import ImagePicker from "@/components/inputs/image-picker";
import Loading from "@/components/loadings/loading";
import StoryGenreMultiSelection from "@/components/selections/story-genres-multi-selection";
import StoryStatusSelection from "@/components/selections/story-status-selection";
import adminService from "@/services/admin";
import Story from "@/types/story";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import TextArea from "@/components/inputs/text-area";
import Button from "@/components/buttons/button";
import { modal } from "@/components/modal/modal.store";
import { snakeCaseToCapitalizeWord } from "@/utils/string";
import Link from "@/components/link/Link";
import FullScreenLoading from "@/components/loadings/full-screen-loading";
import NationSelection from "@/components/selections/nation-selection";
import Nation from "@/types/nation";
import { isEqual } from "lodash";

import StoryNodeContainerDraggable from "@/components/draggable/story-node-container-draggable";
import StoryNode, { StoryNodeContent } from "@/types/story-node";
import withAdmin from "@/hoc/withAdmin";
import { loadingBar } from "@/components/loadings/loading-bar/top-loading-bar.store";

export function EditStory() {
  const params = useParams();
  const router = useRouter();

  const [isUpdating, setIsUpdating] = useState(false);
  const [story, setStory] = useState<Story | null>(null);
  const [coverArtFile, setCoverArtFile] = useState<File>();
  const [editedStory, setEditedStory] = useState<Story | null>(story);

  const [loading, setLoading] = useState(true);

  const storyId = params["storyId"]?.toString() ?? "";

  // Call api for update story

  async function fetchStory() {
    setLoading(true);
    const res = await adminService.getStory(storyId, { isGettingChildren: true, isGettingContent: true });
    setLoading(false);

    if (!res.success) return toast.warning(res.message);

    setStory(res.data ?? null);
  }

  async function onConfirmUpdate() {
    const oldGenresSet = new Set(story?.genres);
    const newGenresSet = new Set(editedStory?.genres);
    const combineGenresSet = new Set([...oldGenresSet, ...newGenresSet]);

    const change = handleParseChildrenAdjustment();

    modal.open("confirm", {
      title: "Xác nhận cập nhật thông tin",
      content: (
        <div className="max-w-[80vw] min-w-[60vw] relative">
          <p>
            <span className="font-semibold">Tiêu đề : </span>
            {story?.title} ➜ {editedStory?.title}
          </p>
          <p>
            <span className="font-semibold">Quốc gia : </span>
            {[story?.nation?.flag_icon, story?.nation?.name].join(" ")} ➜ {[editedStory?.nation?.flag_icon, editedStory?.nation?.name].join(" ")}
          </p>
          <p>
            <span className="font-semibold">Trạng thái : </span>
            {snakeCaseToCapitalizeWord(story?.status ?? "")} ➜ {snakeCaseToCapitalizeWord(editedStory?.status ?? "")}
          </p>

          <div className="flex flex-row flex-wrap gap-x-1">
            <span className="font-semibold">Thể loại : </span>
            {[...combineGenresSet]?.map((genre, i) => (
              <p key={genre} className={`${!newGenresSet.has(genre) ? "text-red-500" : ""} ${!oldGenresSet.has(genre) ? "text-green-500" : ""}`}>
                {snakeCaseToCapitalizeWord(genre)}
                {i < combineGenresSet.size - 1 ? ", " : ""}
              </p>
            ))}
          </div>

          <p>
            <span className="font-semibold">Tóm tắt / Mô tả : </span>
            {story?.summary} ➜ {editedStory?.summary}
          </p>

          <div>
            <span className="font-semibold">Children : </span>
            <div className="max-h-[50vh] overflow-y-scroll">
              <pre className="bg-background p-2 rounded-lg">{JSON.stringify(change, null, 1)}</pre>
            </div>
          </div>
        </div>
      ),
      onConfirm: async () => {
        if (!editedStory) return toast.message("Vui lòng đợi trong giây lát");

        setIsUpdating(true);
        const res = await adminService.updateStory(editedStory, coverArtFile, change);
        setIsUpdating(false);

        if (!res.success) return toast.warning(res.message);

        toast.message("Cập nhật thông tin truyện thành công");

        router.back();

        modal.close();
      },
      onCancel: modal.close,
    });
  }

  function setTitle(title: string) {
    setEditedStory((prev) => {
      if (!prev) return prev;
      const next = { ...prev };
      next.title = title;
      return next;
    });
  }

  function setNation(nation: Nation) {
    setEditedStory((prev) => {
      if (!prev) return prev;
      const next: Story = { ...prev, nation: nation };
      return next;
    });
  }

  function setStoryStatus(status: string) {
    setEditedStory((prev) => {
      if (!prev) return prev;
      const next = { ...prev };
      next.status = status;
      return next;
    });
  }

  function setGenres(genres: string[]) {
    setEditedStory((prev) => {
      if (!prev) return prev;
      const next = { ...prev };
      next.genres = genres;
      return next;
    });
  }

  function setSummary(summary: string) {
    setEditedStory((prev) => {
      if (!prev) return prev;
      const next: Story = { ...prev, summary: summary };
      return next;
    });
  }

  function setChildren(children: StoryNode[]) {
    setEditedStory((prev) => {
      if (!prev) return prev;
      const next: Story = { ...prev, children: children };
      return next;
    });
  }

  function handleParseChildrenAdjustment() {
    let change: {
      delete: { story_node: { id: any }[]; content: { id: any }[] };
      add: { story_node: StoryNode[]; content: StoryNodeContent[] };
      edit: { story_node: StoryNode[]; content: StoryNodeContent[] };
    } = {
      delete: { story_node: [], content: [] },
      add: { story_node: [], content: [] },
      edit: { story_node: [], content: [] },
    };

    function mappingOldChildren(nodes: StoryNode[]) {
      nodes.forEach((child, i) => {
        oldChildren.set(child.id, child);
        mappingOldChildren(child.children ?? []);
      });
    }

    function findDifferenceInContent(newContent?: StoryNodeContent[]) {
      if (newContent && newContent.length > 0) {
        newContent.forEach((content, i) => {
          if (content.isDeleted && !content.isNew) {
            // This content is the old one and being deleted
            change.delete.content.push({ id: content.id });
          } else if (content.isNew && !content.isDeleted) {
            // This content is a new one
            change.add.content.push({ ...content });
          } else if (!content.isNew && !content.isDeleted && content.isEdited) {
            change.edit.content.push({ ...content });
          }
        });
      }
    }

    function findDifferenceInChildren(newChildren?: StoryNode[]) {
      if (newChildren && newChildren.length > 0) {
        newChildren?.forEach((child, i) => {
          if (child.is_deleted && !child.is_new) {
            // This child is the old one and being deleted
            change.delete.story_node.push({ id: child.id });
          } else if (child.is_new && !child.is_deleted) {
            // This child is a new one
            change.add.story_node.push({ ...child });
          } else if (!child.is_new && !child.is_deleted) {
            const oldChild = oldChildren.get(child.id);

            if (
              oldChild?.order_index !== child.order_index ||
              oldChild.title !== child.title ||
              oldChild.type !== child.type ||
              !isEqual(
                oldChild.content?.map((cont) => cont.order_index),
                child.content?.map((cont) => cont.order_index),
              ) ||
              child.content?.find((cont) => cont.isDeleted || cont.isNew)
            ) {
              change.edit.story_node.push({
                id: child.id,
                story_id: child.story_id,
                order_index: child.order_index,
                title: child.title,
                type: child.type,
                content: isEqual(oldChild?.content, child.content)
                  ? []
                  : (child?.content?.filter((cont) => !cont.isDeleted).map((cont, i) => ({ id: cont.id, type: cont.type, order_index: i })) ?? []),
              });
            }
          }

          if (!child.is_deleted) {
            findDifferenceInChildren(newChildren[i]?.children);

            findDifferenceInContent(newChildren[i]?.content);
          }
        });
      }
    }

    const oldChildren = new Map<string, StoryNode>();

    mappingOldChildren(story?.children ?? []);

    findDifferenceInChildren(editedStory?.children);

    return change;
  }

  useEffect(() => {
    fetchStory();
    loadingBar.close();
  }, []);

  useEffect(() => {
    setEditedStory(story);
  }, [story]);

  return (
    <div className="relative w-full">
      {loading ? (
        <Loading className="h-screen"></Loading>
      ) : (
        <div className="flex flex-col gap-5 w-full">
          <Link href={`/stories/${story?.type}/${story?.title}`} className="w-fit m-auto">
            <h2 className="font-semibold">{story?.title}</h2>
          </Link>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 ">
            <div className="col-span-1">
              <ImagePicker
                className="w-full h-full"
                defaultValue={story?.cover_art?.url}
                onChange={(file) => setCoverArtFile(file as File)}
                onReset={() => setCoverArtFile(undefined)}
              />
            </div>

            <div className="flex flex-col gap-2 w-full lg:col-span-2">
              <Input label="Title" placeHolder={story?.title} defaultValue={story?.title} onChange={setTitle} onReset={setTitle} />
              <NationSelection
                defaultValue={story?.nation ? [story?.nation?.flag_icon, story?.nation?.name].join(" ") : null}
                onChange={(nation) => setNation({ name: nation?.name ?? "", flag_icon: nation?.flag_icon })}
                onReset={(nation) => setNation({ name: nation?.name ?? "", flag_icon: nation?.flag_icon })}
              />
              <StoryStatusSelection defaultValue={story?.status as TargetStoryStatus} onChange={(status) => setStoryStatus(status ?? "")} />
              <StoryGenreMultiSelection defaultValue={story?.genres} onChange={setGenres} />

              <TextArea label="Tóm tắt / Mô tả truyện" placeHolder={story?.summary} defaultValue={story?.summary} onChange={setSummary} />
            </div>
          </div>

          {/* Content */}
          <div>{story?.children && <StoryNodeContainerDraggable storyId={storyId} onChange={setChildren} storyNodes={story.children} />}</div>

          <div>
            <Button className="font-semibold text-lg w-full" onClick={onConfirmUpdate}>
              Xác nhận
            </Button>
          </div>
        </div>
      )}

      {isUpdating && <FullScreenLoading label="Đang cập nhật, vui lòng đợi" />}
    </div>
  );
}

export default withAdmin(EditStory);
