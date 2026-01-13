"use client";

import path from "path";
import { toast } from "sonner";
import { useParams } from "next/navigation";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Params } from "next/dist/server/request/params";

import useApp from "@/contexts/AppContext";

import storyService from "@/services/story";
import storyNodeService from "@/services/story-node";
import favouriteService from "@/services/favourite";

import Story from "@/types/story";
import StoryNode from "@/types/story-node";

import ArrowLeftIcon from "@/public/arrows/left-v.svg";
import ArrowRightIcon from "@/public/arrows/right-v.svg";

import Button from "@/components/buttons/button";
import CommentList from "@/components/list/comment-list";
import NumberInput from "@/components/inputs/number-input";
import StoryNodeList from "@/components/list/story-node-list";
import RecommendStories from "@/components/list/recommend-story";
import FontSelection from "@/components/selections/font-selection";

import { sleep } from "@/utils/others";
import { capitalizeWords, snakeCaseToCapitalizeWord } from "@/utils/string";
import historyService from "@/services/history";
import ButtonOfFavouriteStory from "@/components/buttons/favourite-button";

function getParams(params: Params) {
  const storyId = Array.isArray(params.id) ? params.id[0] : params.id ?? "";
  const storyType = Array.isArray(params.type) ? params.type[0] : params.type ?? "";

  const storyParams = { id: storyId, type: storyType };

  const segments = params.segments;

  const storyNodeParams: StoryNode[] = [];

  let temp: StoryNode;
  if (Array.isArray(segments))
    segments?.forEach((seg, i) => {
      if (i % 3 === 0) {
        temp = { type: seg, id: "", order_index: 0, story_id: storyId };
      } else if (i % 3 === 1) {
        temp.order_index = Number(seg);
      } else {
        temp.id = seg;
        storyNodeParams.push(temp);
      }
    });

  return { storyParams, storyNodeParams };
}

// Use to get the next chapter in story node tree
function getNextChapter(storyNode?: StoryNode[], currentChapter?: StoryNode): StoryNode | null {
  let isAtCurrentChapter = false;

  function dfs(storyNode?: StoryNode[], currentChapter?: StoryNode): StoryNode | null {
    if (!storyNode || !storyNode.length) return null;

    for (const node of storyNode) {
      if (isAtCurrentChapter && node.type === "chapter") return node;
      if (node.id === currentChapter?.id) isAtCurrentChapter = true;

      const nextChapter = dfs(node.children, currentChapter);
      if (nextChapter) return nextChapter;
    }

    return null;
  }

  return dfs(storyNode, currentChapter);
}

// Use to get the prev chapter in story node tree
function getPreviousChapter(storyNode?: StoryNode[], currentChapter?: StoryNode): StoryNode | null {
  let previousChapter: StoryNode | null = null;

  function dfs(storyNode?: StoryNode[], currentChapter?: StoryNode): StoryNode | null {
    if (!storyNode || !storyNode.length) return null;

    for (const node of storyNode) {
      if (node.id === currentChapter?.id) return previousChapter;
      if (node.type === "chapter") previousChapter = node;

      const prevChapter = dfs(node.children, currentChapter);
      if (prevChapter) return prevChapter;
    }

    return null;
  }

  return dfs(storyNode, currentChapter);
}

export default function StoryNodeReading() {
  const params = useParams();
  const router = useRouter();

  const app = useApp();

  const { storyParams, storyNodeParams } = getParams(params);

  const { id: storyNodeId } = storyNodeParams[storyNodeParams.length - 1];
  const storyId = storyParams.id;

  const [story, setStory] = useState<Story>();
  const [storyNode, setStoryNode] = useState<StoryNode>();
  const [openStoryNodeList, setOpenStoryNodeList] = useState<boolean>(false);
  const [favouriteId, setFavouriteId] = useState<string>(story?.favourite ? story.favourite.id : "");

  const content = storyNode?.content;

  async function fetchStoryNode() {
    const res = await storyNodeService.getStoryNode({ id: storyNodeId, isGettingContent: true });

    if (!res) return toast.warning("Cannot connect with server");
    if (!res.success) toast.warning(res.message);

    setStoryNode(res.data);
  }

  async function fetchStory() {
    const res = await storyService.getStory({ id: storyId, isGettingChildren: true });

    if (!res) return toast.warning("Cannot connect with server");
    if (!res.success) toast.warning(res.message);

    setStory(res.data);
  }

  async function updateOneViewForStory(storyId: string) {
    const res = await storyService.addOneView(storyId);

    if (!res) return toast.warning("Cannot connect with server");
    if (!res.success) toast.warning(res.message);

    return res.data;
  }

  async function updateOneViewForStoryNode(storyNode: StoryNode[]) {
    for (const node of storyNode) {
      const res = await storyNodeService.addOneView(node.id);

      if (!res) return toast.warning("Cannot connect with server");
      if (!res.success) toast.warning(res.message);
    }
  }

  async function updateReadingHistory(storyId: string, storyNodeId: string) {
    const res = await historyService.addHistory(storyId, storyNodeId);

    if (!res) return toast.warning("Cannot connect with server");
    if (!res.success) return toast.warning(res.message);

    return res.data;
  }

  function handleNavigateStoryNode(storyNode?: StoryNode) {
    if (!storyNode || storyNode.type !== "chapter") return;

    let routeDir = "";

    const newParams = [...storyNodeParams.slice(0, -1), storyNode];

    newParams.forEach((node, i) => (routeDir = path.join(routeDir, node.type, node.order_index.toString(), node.id)));
    router.push(`/story/${story?.type}/${story?.id}/${routeDir.replace(/\\/g, "/")}`);
  }

  useEffect(() => {
    fetchStoryNode();
    fetchStory();
    updateOneViewForStory(storyParams?.id);

    const timer = setTimeout(() => {
      updateOneViewForStoryNode(storyNodeParams);
      updateReadingHistory(storyParams.id, storyNodeId);
    }, 10000);

    window.scrollTo({ top: 0, behavior: "smooth" });

    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    setFavouriteId(story?.favourite ? story.favourite.id : "");
  }, [story]);

  return (
    <div className="flex flex-col gap-5">
      {/* Header - Story title  */}
      <div className="flex flex-row flex-wrap justify-around gap-2">
        <div>
          <h3 onClick={() => router.push(`/story/${story?.type}/${story?.id}`)} className="font-bold cursor-pointer">
            [{snakeCaseToCapitalizeWord(story?.type ?? "")}] {story?.title}
          </h3>
          <div className="flex flex-row flex-wrap gap-1 text-foreground">
            {storyNodeParams.map((node, i) => (
              <h4 key={i}>
                {capitalizeWords(node.type)} {node.order_index} {i < storyNodeParams.length - 1 && "➤"}
              </h4>
            ))}
            <h4>:{storyNode?.title} Tiêu đề</h4>
          </div>

          <div>
            <span className="italic font-bold text-foreground">Lượt xem:</span> {storyNode?.view}
          </div>
        </div>
        <div className="flex flex-row gap-3 justify-center items-center">
          <div onClick={() => handleNavigateStoryNode(getPreviousChapter(story?.children, storyNode) ?? undefined)}>
            <ArrowLeftIcon className="w-6 h-6 cursor-pointer"></ArrowLeftIcon>
          </div>
          <h3 className=" cursor-pointer" onClick={() => setOpenStoryNodeList(!openStoryNodeList)}>
            {capitalizeWords(storyNode?.type ?? "")} {storyNode?.order_index}
          </h3>
          <div onClick={() => handleNavigateStoryNode(getNextChapter(story?.children, storyNode) ?? undefined)}>
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
              className="w-full "
            >
              <StoryNodeList
                className="shadow-2xs"
                onClickItem={(nodeList) => handleNavigateStoryNode(nodeList.at(nodeList.length - 1))}
                storyNodes={story?.children}
                size={story?.number_of_chidren}
              ></StoryNodeList>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Button favourite, download */}
      <div className="flex flex-row flex-wrap justify-center items-center gap-5">
        <ButtonOfFavouriteStory></ButtonOfFavouriteStory>
        <Button>Tải về</Button>
      </div>

      {/* Main content */}
      <div className="flex flex-col gap-3">
        {/* Main header */}
        <div className="flex flex-row flex-wrap gap-5  justify-center">
          <FontSelection onChange={(fontId) => app?.updateReadingFont(fontId)} defaultValue={app?.readingFont}></FontSelection>
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
            <div key={i} className="flex flex-col justify-center items-center gap-1 w-full">
              {con.type === "image" ? (
                <img className="object-cover rounded-sm w-full" src={process.env.NEXT_PUBLIC_API_URL + "uploads/story/" + con.image_url} alt="Cover Art"></img>
              ) : con.type === "title" ? (
                <p className="w-full text-center font-bold text-[1.8em]">{con.content}</p>
              ) : con.type === "header" ? (
                con.level == 1 ? (
                  <p className="w-full text-start font-semibold text-[1.5em]">{con.content}</p>
                ) : con.level == 2 ? (
                  <p className="w-full text-start font-semibold text-[1.2em]">{con.content}</p>
                ) : (
                  con.level == 3 && <p className="w-full text-start italic text-[1em]">{con.content}</p>
                )
              ) : (
                con.type === "text" && <p className="w-full text-start">{con.content}</p>
              )}
            </div>
          ))}
        </div>

        {/* Button switch page */}
        <div className="flex flex-row gap-2">
          <div className="flex-1" onClick={() => handleNavigateStoryNode(getPreviousChapter(story?.children, storyNode) ?? undefined)}>
            <Button className="text-[1.1em] w-full">Chapter trước</Button>
          </div>
          <div className="flex-1" onClick={() => handleNavigateStoryNode(getNextChapter(story?.children, storyNode) ?? undefined)}>
            <Button className="text-[1.1em] w-full">Chapter sau</Button>
          </div>
        </div>
      </div>

      {/* Comment */}
      {/* <div>
        <CommentList storyNode={storyNode} elementPerPage={5}></CommentList>
      </div> */}

      {/* Recommend */}
      <div>
        <RecommendStories></RecommendStories>
      </div>
    </div>
  );
}
