"use client";

import { toast } from "sonner";
import { useParams } from "next/navigation";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";

import useApp from "@/contexts/AppContext";

import storyService from "@/services/story";
import storyNodeService from "@/services/story-node";

import Story from "@/types/story";
import StoryNode, { StoryNodeContent } from "@/types/story-node";

import ArrowLeftIcon from "@/public/arrows/left-v.svg";
import ArrowRightIcon from "@/public/arrows/right-v.svg";

import Button from "@/components/buttons/button";
import NumberInput from "@/components/inputs/number-input";
import StoryNodeList from "@/components/list/story-node-list";
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

const RATIO_LINE_SPACING = 0.4;

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

export default function ReadingStoryPage() {
  const app = useApp();
  const auth = useAuth();

  const params = useParams();
  const router = useRouter();

  const getParams = useCallback(() => {
    const storyType = decodeURIComponent(params.storyType?.toString() ?? "");
    const storyTitle = decodeURIComponent(params.title?.toString() ?? "");
    const storyNodes = Array.isArray(params.storyNodes)
      ? params.storyNodes.map((node) => {
          const splitNode = decodeURIComponent(node).split(" ");
          return {
            storyNodeId: "",
            storyNodeType: splitNode[0],
            orderIndex: Number(splitNode[1]),
          };
        })
      : [];

    return { storyType, storyTitle, storyNodes };
  }, [params]);

  const { storyType, storyTitle, storyNodes } = getParams();

  const [story, setStory] = useState<Story>();

  const [storyNodeId, setStoryNodeId] = useState("");
  const [storyNode, setStoryNode] = useState<StoryNode>();

  const [nextNode, setNextNode] = useState<StoryNode | null>(null);
  const [prevNode, setPrevNode] = useState<StoryNode | null>(null);

  const [readingContents, setReadingContents] = useState<(StoryNodeContent | null)[]>([]);

  const content = storyNode?.content;
  const continueReadingContentKey = `storyId=${story?.id}&storyNodeId=${storyNodeId}`;

  function handleNavigateStoryNode(storyNodes?: StoryNode[]) {
    if (!storyNodes || storyNodes?.at(-1)?.type !== "chapter") return;

    loadingBar.open({});

    const routeDir = storyNodes.map((node) => `${node.type} ${node.order_index}`).join("/");

    modal.close();

    router.push(`/stories/${story?.type}/${story?.title}/${routeDir}`);
  }

  function handleOpenStoryNodeList() {
    modal.open("custom", {
      content: (
        <div className="min-w-[350px] w-[80vw] h-[80vh] flex flex-col gap-2 justify-between">
          <StoryNodeList
            onClickItem={(nodeList) => {
              handleNavigateStoryNode(nodeList);
            }}
            storyNodes={story?.children}
            size={story?.number_of_children}
          />

          <Button onClick={() => modal.close()} className="my-2 ml-auto">
            Đóng
          </Button>
        </div>
      ),
      onClickOutside: modal.close,
    });
  }

  function goToPrevChapter() {
    if (!prevNode) return;
    const storyNodes = buildStoryNodeParent(story?.children ?? [], prevNode.id);
    handleNavigateStoryNode(storyNodes);
  }

  function goToNextChapter() {
    if (!nextNode) return;
    const storyNodes = buildStoryNodeParent(story?.children ?? [], nextNode.id);
    handleNavigateStoryNode(storyNodes);
  }

  useEffect(() => {
    if (!storyNodeId) return;

    async function fetchStoryNode() {
      const res = await storyNodeService.getStoryNodeById(storyNodeId, { isGettingContent: true });

      if (!res.success) toast.warning(res.message);

      setPrevNode(findPrevChapter(story?.children ?? [], res.data?.id ?? ""));
      setNextNode(findNextChapter(story?.children ?? [], res.data?.id ?? ""));

      setStoryNode(res.data);
    }

    async function updateReadingHistory() {
      console.log(readingContents);

      if (!story?.id) return;

      const res = await historyService.addHistory(story?.id, storyNodeId);

      if (!res.success) return toast.warning(res.message);

      return res.data;
    }

    async function updateOneViewForStoryNode(storyNodeId: string) {
      const res = await storyNodeService.addOneView(storyNodeId);

      if (!res.success) toast.warning(res.message);
    }

    fetchStoryNode();

    const timer = setTimeout(() => {
      updateOneViewForStoryNode(storyNodeId);
      if (auth?.user) updateReadingHistory();
    }, 10000);

    return () => clearTimeout(timer);
  }, [storyNodeId]);

  useEffect(() => {
    const continueReadingContentId = localStorage.getItem(continueReadingContentKey);

    if (!continueReadingContentId) return;

    const element = document.querySelector(`[data-content-id="${continueReadingContentId}"]`);

    if (element) {
      element.scrollIntoView({ behavior: "smooth" });
    }
  }, [storyNode]);

  useEffect(() => {
    async function fetchStory() {
      const res = await storyService.getStoryByTitle(storyTitle ?? "", { isGettingChildren: true });

      if (!res.success) toast.warning(res.message);

      setStory(res.data);

      let children = res.data?.children ?? [];

      let currentStoryNode: StoryNode | null = null;
      for (const node of storyNodes) {
        for (const child of children) {
          if (node.storyNodeType === child.type && node.orderIndex === child.order_index) {
            currentStoryNode = child;
            children = child.children ?? [];
            break;
          }
        }
      }

      const storyNodeId = currentStoryNode?.id ?? "";
      setStoryNodeId(storyNodeId);
    }

    fetchStory();

    loadingBar.close();

    window.scrollTo({ top: 0, behavior: "smooth" });
  }, []);

  useEffect(() => {
    const timeout = setTimeout(() => {
      const readingContent = readingContents[0];

      if (!readingContent) return;

      localStorage.setItem(continueReadingContentKey, readingContent.id.toString());
    }, 2000);

    return () => clearTimeout(timeout);
  }, [readingContents]);

  return (
    <div className="flex flex-col gap-5">
      {/* Header - Story title  */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-2 px-2 justify-center items-center gap-x-2 gap-y-5 my-5">
        <div className="m-auto">
          <p>[{snakeCaseToCapitalizeWord(story?.type ?? "")}]</p>
          <Link href={`/stories/${story?.type}/${story?.title}`}>
            <p className="font-bold text-4xl cursor-pointer py-5">{story?.title}</p>
          </Link>
          <div className="flex flex-row flex-wrap gap-1 text-foreground py-2">
            {storyNodes.map((node, i) => (
              <h4 key={i}>
                {capitalizeWords(node.storyNodeType)} {node.orderIndex} {i < storyNodes.length - 1 && "➤"}
              </h4>
            ))}
            <h4>:{storyNode?.title}</h4>
          </div>
          <div>
            <span className="italic font-bold text-foreground">Lượt xem:</span> {storyNode?.view}
          </div>
        </div>

        <div className="flex flex-row gap-3 justify-center items-center">
          <div onClick={goToPrevChapter}>
            <ArrowLeftIcon className="w-6 h-6 cursor-pointer"></ArrowLeftIcon>
          </div>

          <h3 className=" cursor-pointer" onClick={handleOpenStoryNodeList}>
            {capitalizeWords(storyNode?.type ?? "")} {storyNode?.order_index}
          </h3>

          <div onClick={goToNextChapter}>
            <ArrowRightIcon className="w-6 h-6 cursor-pointer"></ArrowRightIcon>
          </div>
        </div>
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
                style={{
                  paddingTop: (app?.readingLineSpacing ?? 1) * RATIO_LINE_SPACING,
                  paddingBottom: (app?.readingLineSpacing ?? 1) * RATIO_LINE_SPACING,
                }}
                className={`flex flex-col justify-center items-center w-full text-foreground/80 ${con.type === "image" ? "" : `px-2.5`}`}
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
                  con.type === "text" && <div className="w-full text-start">{con.content}</div>
                )}
              </div>
            ))}
          </InViewList>
        </div>

        {/* Button switch page */}
        <div className="grid grid-cols-2 flex-wrap justify-center items-center gap-10 px-2 m-auto my-5 text-lg">
          <div className="flex-1" onClick={goToPrevChapter}>
            <Button className="font-semibold w-full py-2" disable={!prevNode}>
              <ArrowLeftIcon className="w-5 h-5" /> Chapter trước
            </Button>
          </div>
          <div className="flex-1" onClick={goToNextChapter}>
            <Button className="font-semibold w-full py-2" disable={!nextNode}>
              Chapter sau <ArrowRightIcon className="w-5 h-5" />
            </Button>
          </div>
        </div>
      </div>

      {/* Comment */}
      <CommentMasonryGrid className="my-2 mx-2.5" storyId={story?.id ?? ""} storyNodeId={storyNodeId}></CommentMasonryGrid>

      {/* Recommend */}
      {story && <RecommendStories story={story} className="max-w-[1800] mx-auto" />}
    </div>
  );
}
