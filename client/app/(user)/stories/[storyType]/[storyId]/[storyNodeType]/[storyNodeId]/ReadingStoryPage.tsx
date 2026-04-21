"use client";

import { toast } from "sonner";
import { useParams } from "next/navigation";
import { useRouter } from "next/navigation";
import React, { useEffect, useMemo, useState } from "react";

import { routes } from "@/lib/routes";

import useApp from "@/contexts/AppContext";

import storyService from "@/services/story";
import storyNodeService from "@/services/story-node";

import Story from "@/types/story";
import StoryNode, { StoryNodeContent } from "@/types/story-node";

import ArrowLeftIcon from "@/public/arrows/left-v.svg";
import ArrowRightIcon from "@/public/arrows/right-v.svg";

import Button from "@/components/buttons/button";
import NumberInput from "@/components/inputs/number-input";
import StoryNodeList from "@/components/table/story-node-list-table";
import RecommendStories from "@/components/list/recommend-story";
import FontSelection from "@/components/selections/font-selection";

import { capitalizeWords, snakeCaseToCapitalizeWord } from "@/utils/string";
import historyService from "@/services/history";
import ButtonOfFavouriteStory from "@/components/buttons/favourite-button";
import useAuth from "@/contexts/AuthContext";
import CommentMasonryGrid from "@/components/grids/comment-masonry-grid";
import Image from "next/image";
import { loadingBar } from "@/components/loadings/loading-bar/top-loading-bar.store";
import Link from "next/link";
import { modal } from "@/components/modal/modal.store";
import InViewList from "@/components/list/inview-list";
import Navbar from "@/components/layouts/navbar";

const RATIO_LINE_SPACING = 0.6;

function buildStoryNodeParent(tree: StoryNode[], targetNodeId: string) {
  const parentList: StoryNode[] = [];

  function dfs(tree: StoryNode[]): boolean {
    for (const node of tree) {
      if (node.id === targetNodeId) {
        parentList.push(node);
        return true;
      }

      parentList.push(node);

      const isFound = dfs(node.children ?? []);
      if (isFound) return true;

      parentList.pop();
    }

    return false;
  }

  dfs(tree);

  return parentList;
}

function findPrevChapter(tree: StoryNode[], targetNodeId: string): StoryNode | null {
  let prevChapter: StoryNode | null = null;

  function dfs(tree: StoryNode[]): StoryNode | null {
    for (const node of tree) {
      if (node.id === targetNodeId) {
        return prevChapter;
      }

      if (node.type === "chapter") prevChapter = node;

      const found = dfs(node.children ?? []);
      if (found) return found;
    }

    return null;
  }

  return dfs(tree);
}

function findNextChapter(tree: StoryNode[], targetNodeId: string): StoryNode | null {
  let isFoundTargetId = false;

  function dfs(tree: StoryNode[]): StoryNode | null {
    for (const node of tree) {
      if (isFoundTargetId && node.type === "chapter") return node;

      if (node.id === targetNodeId) isFoundTargetId = true;

      const found = dfs(node.children ?? []);
      if (found) return found;
    }

    return null;
  }

  return dfs(tree);
}

const StoryNodesList = React.memo(
  ({
    goToPrevChapter,
    goToNextChapter,
    handleOpenStoryNodeList,
    storyNode,
    className,
  }: {
    goToPrevChapter: () => void;
    goToNextChapter: () => void;
    handleOpenStoryNodeList: () => void;
    storyNode?: StoryNode;

    className?: string;
  }) => {
    return (
      <div className={`flex flex-row gap-3 justify-center items-center text-xl ${className}`}>
        <ArrowLeftIcon className="w-5 h-5 cursor-pointer shrink-0" onClick={goToPrevChapter} />

        <p className=" cursor-pointer" onClick={handleOpenStoryNodeList}>
          {capitalizeWords(storyNode?.type ?? "")} {storyNode?.order_index}
        </p>

        <ArrowRightIcon className="w-5 h-5 cursor-pointer shrink-0" onClick={goToNextChapter} />
      </div>
    );
  },
);

export default function ReadingStoryPage() {
  const app = useApp();
  const auth = useAuth();

  const params = useParams();
  const router = useRouter();

  const storyId = useMemo(() => params.storyId?.toString(), [params]);
  const storyNodeId = useMemo(() => params.storyNodeId?.toString(), [params]);

  const [story, setStory] = useState<Story>();
  const [storyNode, setStoryNode] = useState<StoryNode>();
  const [storyNodes, setStoryNodes] = useState<StoryNode[]>([]);

  const [nextNode, setNextNode] = useState<StoryNode | null>(null);
  const [prevNode, setPrevNode] = useState<StoryNode | null>(null);

  const [readingContents, setReadingContents] = useState<(StoryNodeContent | null)[]>([]);

  const content = storyNode?.content;
  const continueReadingContentKey = `storyId=${story?.id}&storyNodeId=${storyNodeId}`;

  async function fetchStory() {
    const res = await storyService.getStoryById(storyId ?? "", { isGettingChildren: true });

    if (!res.success) toast.warning(res.message);

    setStory(res.data);
  }

  async function fetchStoryNode() {
    if (!storyNodeId) return;

    const res = await storyNodeService.getStoryNodeById(storyNodeId, { isGettingContent: true });

    if (!res.success) toast.warning(res.message);

    setStoryNode(res.data);
  }

  async function updateReadingHistory() {
    if (!storyNodeId || !storyId) return;

    const res = await historyService.addHistory(storyId, storyNodeId);

    if (!res.success) return toast.warning(res.message);

    return res.data;
  }

  async function updateOneViewForStoryNode(storyNodeId: string) {
    const res = await storyNodeService.addOneView(storyNodeId);

    if (!res.success) toast.warning(res.message);
  }

  function handleNavigateStoryNode(storyNodes: StoryNode[]) {
    const storyNode = storyNodes.at(storyNodes.length - 1);

    if (!storyNode) return;

    if (storyNode.type !== "chapter") return;

    loadingBar.open({});

    modal.close();

    router.push(routes.storyNode({ storyType: story?.type, storyId: story?.id, storyNodeType: storyNode?.type, storyNodeId: storyNode?.id }));
  }

  function handleOpenStoryNodeList() {
    modal.open("custom", {
      content: (
        <div className="min-w-[350px] w-[80vw] h-[80vh] flex flex-col gap-2 justify-between">
          <StoryNodeList onClickItem={handleNavigateStoryNode} storyNodes={story?.children} size={story?.number_of_children} />

          <Button buttonType="default" onClick={() => modal.close()} className="my-2 ml-auto">
            Đóng
          </Button>
        </div>
      ),
      onClickOutside: modal.close,
    });
  }

  function goToPrevChapter() {
    if (!prevNode) return;

    handleNavigateStoryNode([prevNode]);
  }

  function goToNextChapter() {
    if (!nextNode) return;
    handleNavigateStoryNode([nextNode]);
  }

  useEffect(() => {
    if (!storyNodeId) return;

    fetchStoryNode();
  }, [storyNodeId]);

  useEffect(() => {
    const continueReadingContentId = localStorage.getItem(continueReadingContentKey);

    if (continueReadingContentId) {
      const element = document.querySelector(`[data-content-id="${continueReadingContentId}"]`);

      if (element) {
        element.scrollIntoView({ behavior: "smooth" });
      }
    }

    let timer: NodeJS.Timeout;
    if (storyNode) {
      if (storyNode.type === "chapter") {
        timer = setTimeout(() => {
          updateOneViewForStoryNode(storyNode.id);
          if (auth?.user) updateReadingHistory();
        }, 10000);
      }
    }

    return () => clearTimeout(timer);
  }, [storyNode]);

  useEffect(() => {
    const timeout = setTimeout(() => {
      const readingContent = readingContents[0];

      if (!readingContent) return;

      localStorage.setItem(continueReadingContentKey, readingContent.id.toString());
    }, 2000);

    return () => clearTimeout(timeout);
  }, [readingContents]);

  useEffect(() => {
    if (!storyId) return;

    fetchStory();

    window.scrollTo({ top: 0, behavior: "smooth" });
  }, [storyId]);

  useEffect(() => {
    if (!storyNode) return;

    setStoryNodes(buildStoryNodeParent(story?.children ?? [], storyNode.id));

    setPrevNode(findPrevChapter(story?.children ?? [], storyNode?.id ?? ""));
    setNextNode(findNextChapter(story?.children ?? [], storyNode?.id ?? ""));
  }, [storyNode, story?.children]);

  useEffect(() => {
    loadingBar.close();
  }, []);

  return (
    <div className="flex flex-col gap-5">
      <Navbar
        items={[
          "Stories",
          snakeCaseToCapitalizeWord(story?.type ?? ""),
          snakeCaseToCapitalizeWord(story?.title ?? ""),
          ...storyNodes.map((node) => `${snakeCaseToCapitalizeWord(node.type)} ${snakeCaseToCapitalizeWord(node.order_index.toString())}`),
        ]}
        onClickItem={(i) => {
          if (i === 0) router.push(routes.story());
          else if (i === 1) router.push(routes.story({ storyType: story?.type ?? "" }));
          else if (i === 2) router.push(routes.story({ storyType: story?.type ?? "", storyId: story?.id ?? "" }));
        }}
        className="p-2 px-3"
      />

      {/* Header - Story title  */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-2 px-2 justify-center items-center gap-x-2 gap-y-5 my-5">
        <div className="m-auto">
          <p>[{snakeCaseToCapitalizeWord(story?.type ?? "")}]</p>
          <Link href={`/stories/${story?.type}/${story?.id}`}>
            <p className="font-bold text-4xl cursor-pointer py-5">{story?.title}</p>
          </Link>
          <div className="flex flex-row flex-wrap gap-1 text-foreground py-2">
            {storyNodes.map((node, i) => (
              <h4 key={i}>
                {capitalizeWords(node.type)} {node.order_index} {i < storyNodes.length - 1 && "➤"}
              </h4>
            ))}
            <h4>:{storyNode?.title}</h4>
          </div>
          <div>
            <span className="italic font-bold text-foreground">Lượt xem:</span> {storyNode?.view}
          </div>
        </div>

        <StoryNodesList
          storyNode={storyNode}
          goToPrevChapter={goToPrevChapter}
          goToNextChapter={goToNextChapter}
          handleOpenStoryNodeList={handleOpenStoryNodeList}
        />
      </div>

      {/* Button favourite */}
      <ButtonOfFavouriteStory story={story} className="w-full max-w-72 m-auto"></ButtonOfFavouriteStory>

      {/* Main content */}
      <div className="flex flex-col gap-3">
        {/* Main header */}
        <div className="flex flex-row flex-wrap gap-5  justify-center">
          <FontSelection onChange={(fontId) => app?.updateReadingFont(fontId)} value={app?.readingFont ?? ""}></FontSelection>
          <div className="flex flex-row gap-2 justify-center items-center w-fit">
            <p>Khoảng cách dòng</p>
            <NumberInput
              className="bg-background-items"
              value={app?.readingLineSpacing}
              onChange={(value) => app?.updateReadingLineSpacing(value)}
            ></NumberInput>
          </div>
          <div className="flex flex-row gap-2 justify-center items-center w-fit">
            <p>Cỡ chữ</p>
            <NumberInput className="bg-background-items" value={app?.readingTextSize} onChange={(value) => app?.updateReadingTextSize(value)}></NumberInput>
          </div>
        </div>

        {/* Content */}
        <div
          className="flex flex-col gap-5 w-full"
          style={{
            fontSize: app?.readingTextSize + "px",
            fontFamily: capitalizeWords(app?.readingFont ?? ""),
            lineHeight: app?.readingLineSpacing + "px",
          }}
        >
          <InViewList
            onInView={(indexs) => {
              if (indexs && indexs.length > 0) setReadingContents(indexs.map((index) => content?.[index] ?? null));
            }}
            threshold={0.5}
          >
            {[...(content ?? [])]?.map((con, i) => (
              <div
                key={i}
                data-content-id={con.id}
                style={
                  con.type === "image"
                    ? {}
                    : {
                        paddingTop: (app?.readingLineSpacing ?? 1) * RATIO_LINE_SPACING,
                        paddingBottom: (app?.readingLineSpacing ?? 1) * RATIO_LINE_SPACING,
                      }
                }
                className={`flex flex-col justify-center items-center w-full text-foreground/80 ${con.type === "image" ? "" : `px-1`}`}
              >
                {con.type === "image" && con?.image?.url ? (
                  <Image
                    className="max-w-[1200px]"
                    src={con.image?.url}
                    alt="Cover Art"
                    width={1200}
                    height={1800}
                    style={{ width: "100%", height: "auto" }}
                  ></Image>
                ) : con.type === "title" ? (
                  <div className="w-full text-center font-bold text-[1.8em] py-5">{con.content}</div>
                ) : con.type === "header" ? (
                  <div className="w-full text-start font-semibold text-[1.2em] py-2.5">{con.content}</div>
                ) : (
                  con.type === "text" && (
                    <div
                      className="w-full text-start flex flex-col"
                      style={{
                        gap: (app?.readingLineSpacing ?? 1) * RATIO_LINE_SPACING + "px",
                      }}
                    >
                      {con.content?.split("\n").map((text, i) => (
                        <p key={i}>{text}</p>
                      ))}
                    </div>
                  )
                )}
              </div>
            ))}
          </InViewList>
        </div>

        {/* Button switch page */}
        <div className="grid grid-cols-3 flex-wrap justify-center items-center gap-2 px-2 m-auto my-5">
          <Button buttonType="default" className="font-semibold w-full py-2" disable={!prevNode} onClick={goToPrevChapter}>
            <ArrowLeftIcon className="w-4 h-4 shrink-0" /> Trước
          </Button>

          <p className=" cursor-pointer w-fit m-auto text-xl" onClick={handleOpenStoryNodeList}>
            {capitalizeWords(storyNode?.type ?? "")} {storyNode?.order_index}
          </p>

          <Button buttonType="default" className="font-semibold w-full py-2" disable={!nextNode} onClick={goToNextChapter}>
            Tiếp <ArrowRightIcon className="w-4 h-4 shrink-0" />
          </Button>
        </div>

        <div className="">
          <p className="text-foreground/60">[{snakeCaseToCapitalizeWord(story?.type ?? "")}]</p>
          <Link href={`/stories/${story?.type}/${story?.id}`}>
            <p className="font-bold text-4xl cursor-pointer py-3">{story?.title}</p>
          </Link>
        </div>
      </div>

      {/* Comment */}
      {storyId && storyNodeId && <CommentMasonryGrid className="my-2 mx-2.5" storyId={storyId} storyNodeId={storyNodeId} />}

      {/* Recommend */}
      {story && <RecommendStories story={story} className="max-w-[1800] mx-auto" />}
    </div>
  );
}
