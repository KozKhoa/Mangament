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
import StoryNode from "@/types/story-node";

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
  const [openStoryNodeList, setOpenStoryNodeList] = useState<boolean>(false);

  const content = storyNode?.content;

  const fetchStoryNode = useCallback(async () => {
    const res = await storyNodeService.getStoryNodeById(storyNodeId, { isGettingContent: true });

    if (!res.success) toast.warning(res.message);

    setStoryNode(res.data);
  }, [storyNodeId]);

  const fetchStory = useCallback(async () => {
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
  }, [storyTitle, storyNodes]);

  async function updateOneViewForStoryNode(storyNodeId: string) {
    const res = await storyNodeService.addOneView(storyNodeId);

    if (!res.success) toast.warning(res.message);
  }

  const updateReadingHistory = useCallback(async () => {
    if (!story?.id) return;

    const res = await historyService.addHistory(story?.id, storyNodeId);

    if (!res.success) return toast.warning(res.message);

    return res.data;
  }, [story?.id, storyNodeId]);

  function handleNavigateStoryNode(storyNodes?: StoryNode[]) {
    if (!storyNodes || storyNodes?.at(-1)?.type !== "chapter") return;

    loadingBar.open({});

    const routeDir = storyNodes.map((node) => `${node.type} ${node.order_index}`).join("/");

    router.push(`/stories/${story?.type}/${story?.title}/${routeDir}`);
  }

  const goToPrevChapter = useCallback(() => {
    const prevChapter = findPrevChapter(story?.children ?? [], storyNodeId);
    if (!prevChapter) return;
    const storyNodes = buildStoryNodeParent(story?.children ?? [], prevChapter.id);
    handleNavigateStoryNode(storyNodes);
  }, [storyNodeId, story]);

  const goToNextChapter = useCallback(() => {
    const nextChapter = findNextChapter(story?.children ?? [], storyNodeId);
    if (!nextChapter) return;
    const storyNodes = buildStoryNodeParent(story?.children ?? [], nextChapter.id);
    handleNavigateStoryNode(storyNodes);
  }, [storyNodeId, story]);

  useEffect(() => {
    if (!storyNodeId) return;
    fetchStoryNode();

    const timer = setTimeout(() => {
      updateOneViewForStoryNode(storyNodeId);
      if (auth?.user) updateReadingHistory();
    }, 10000);

    return () => clearTimeout(timer);
  }, [storyNodeId]);

  useEffect(() => {
    fetchStory();

    loadingBar.close();

    window.scrollTo({ top: 0, behavior: "smooth" });
  }, []);

  return (
    <div className="flex flex-col gap-5">
      {/* Header - Story title  */}
      <div className="flex flex-row flex-wrap justify-around gap-2">
        <div>
          <h3 onClick={() => router.push(`/stories/${story?.type}/${story?.title}`)} className="font-bold cursor-pointer">
            [{snakeCaseToCapitalizeWord(story?.type ?? "")}] {story?.title}
          </h3>
          <div className="flex flex-row flex-wrap gap-1 text-foreground">
            {storyNodes.map((node, i) => (
              <h4 key={i}>
                {capitalizeWords(node.storyNodeType)} {node.orderIndex} {i < storyNodes.length - 1 && "➤"}
              </h4>
            ))}
            <h4>:{storyNode?.title} Tiêu đề</h4>
          </div>

          <div>
            <span className="italic font-bold text-foreground">Lượt xem:</span> {storyNode?.view}
          </div>
        </div>
        <div className="flex flex-row gap-3 justify-center items-center">
          <div onClick={goToPrevChapter}>
            <ArrowLeftIcon className="w-6 h-6 cursor-pointer"></ArrowLeftIcon>
          </div>

          <h3 className=" cursor-pointer" onClick={() => setOpenStoryNodeList(!openStoryNodeList)}>
            {capitalizeWords(storyNode?.type ?? "")} {storyNode?.order_index}
          </h3>

          <div onClick={goToNextChapter}>
            <ArrowRightIcon className="w-6 h-6 cursor-pointer"></ArrowRightIcon>
          </div>
        </div>
        <AnimatePresence>
          {openStoryNodeList && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "fit-content", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.1, ease: "linear" }}
              className="w-full bg-background-items"
            >
              <StoryNodeList
                className="shadow-2xs"
                onClickItem={(nodeList) => handleNavigateStoryNode(nodeList)}
                storyNodes={story?.children}
                size={story?.number_of_children}
              ></StoryNodeList>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Button favourite, download */}
      <div className="grid grid-cols-2 flex-wrap justify-center items-center gap-2 px-2 max-w-96 m-auto">
        <ButtonOfFavouriteStory story={story} className="w-full"></ButtonOfFavouriteStory>
        <Button className="font-semibold w-full">Tải về</Button>
      </div>

      {/* Main content */}
      <div className="flex flex-col gap-3">
        {/* Main header */}
        <div className="flex flex-row flex-wrap gap-5  justify-center">
          <FontSelection onChange={(fontId) => app?.updateReadingFont(fontId)} value={app?.readingFont ?? ""}></FontSelection>
          <div className="flex flex-row gap-2 justify-center items-center w-fit">
            <p>Khoảng cách dòng</p>
            <NumberInput
              className="bg-background-items"
              defaultValue={app?.readingLineSpacing}
              onChange={(value) => app?.updateReadingLineSpacing(value)}
            ></NumberInput>
          </div>
          <div className="flex flex-row gap-2 justify-center items-center w-fit">
            <p>Cỡ chữ</p>
            <NumberInput
              className="bg-background-items"
              defaultValue={app?.readingTextSize}
              onChange={(value) => app?.updateReadingTextSize(value)}
            ></NumberInput>
          </div>
        </div>

        {/* Content */}
        <div
          style={{
            fontSize: app?.readingTextSize + "px",
            fontFamily: capitalizeWords(app?.readingFont ?? ""),
            lineHeight: app?.readingLineSpacing + "px",
          }}
        >
          {content?.map((con, i) => (
            <div key={i} className="flex flex-col justify-center items-center gap-2 w-full">
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
                <p className="w-full text-center font-bold text-[1.8em]">{con.content}</p>
              ) : con.type === "header" ? (
                <p className="w-full text-start font-semibold text-[1.2em]">{con.content}</p>
              ) : (
                con.type === "text" && <p className="w-full text-start">{con.content}</p>
              )}
            </div>
          ))}
        </div>

        {/* Button switch page */}
        <div className="grid grid-cols-2 flex-wrap justify-center items-center gap-2 px-2 max-w-96 m-auto">
          <div className="flex-1" onClick={goToPrevChapter}>
            <Button className="font-semibold w-full">Chapter trước</Button>
          </div>
          <div className="flex-1" onClick={goToNextChapter}>
            <Button className="font-semibold w-full">Chapter sau</Button>
          </div>
        </div>
      </div>

      {/* Comment */}
      <CommentMasonryGrid className="my-2 mx-2.5" storyId={story?.id ?? ""} storyNodeId={storyNodeId}></CommentMasonryGrid>

      {/* Recommend */}
      <div>
        <RecommendStories></RecommendStories>
      </div>
    </div>
  );
}
