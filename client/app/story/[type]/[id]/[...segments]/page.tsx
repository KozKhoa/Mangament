"use client";

import { useParams } from "next/navigation";
import { Params } from "next/dist/server/request/params";
import useApp from "@/contexts/AppContext";
import FontSelection from "@/components/selections/font-selection";
import { useEffect, useState } from "react";
import storyNodeService from "@/services/stroy-node";
import { StoryNodeParams, StoryParams } from "@/types/params";
import { toast } from "sonner";
import StoryNode from "@/types/story-node";
import { capitalizeWords } from "@/utils/string";
import Story from "@/types/story";
import storyService from "@/services/story";

import ArrowRightIcon from "@/public/arrows/right-v.svg";
import ArrowLeftIcon from "@/public/arrows/left-v.svg";
import StoryNodeList from "@/components/list/story-node-list";
import ButtonDropdown from "@/components/buttons/dropdown/btn-dropdown";
import { AnimatePresence, motion } from "framer-motion";
import favouriteService from "@/services/user/favourite";
import Button from "@/components/buttons/button";
import NumberInput from "@/components/inputs/number-input";
import { s } from "framer-motion/client";

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

export default function StoryNodeReading() {
  const params = useParams();

  const app = useApp();

  const { storyParams, storyNodeParams } = getParams(params);

  const { type, id, order_index } = storyNodeParams[storyNodeParams.length - 1];

  const [openStoryNodeList, setOpenStoryNodeList] = useState<boolean>(false);
  const [story, setStory] = useState<Story>();
  const [storyNode, setStoryNode] = useState<StoryNode>();
  const [chapterIndex, setChapterIndex] = useState<number>(Number(order_index));
  const [favouriteId, setFavouriteId] = useState<string>(story?.favourite ? story.favourite.id : "");

  const content = storyNode?.content;
  console.log(content);

  async function fetchStoryNode() {
    const params: StoryNodeParams = {
      isGettingChildren: false,
      isGettingContent: true,
    };
    const res = await storyNodeService.get(id, params);

    if (!res) return toast.warning("Server Error");
    if (!res.success) toast.warning(res.message);

    console.log(res.data);

    setStoryNode(res.data);
  }

  async function fetchStory() {
    const params: StoryParams = {
      id: storyParams.id,
      isGettingChildren: true,
    };
    const res = await storyService.get(params);

    if (!res) return toast.warning("Server Error");
    if (!res.success) toast.warning(res.message);

    setStory(res.data);
  }

  async function addStoryToFavourite(storyId: string) {
    const res = await favouriteService.post({ storyId: storyId });
    if (!res) return toast.warning("Server Error");
    if (!res.success) return toast.warning(res.message);

    toast.message("Add successfully");

    setFavouriteId(res.data.favourite.id);

    return res.data;
  }

  async function removeStoryFromFavouite(favouriteId: string) {
    const res = await favouriteService.remove(favouriteId);

    if (!res) return toast.warning("Server Error");
    if (!res.success) return toast.warning(res.message);

    toast.message("Remove successfully");
    setFavouriteId("");
  }

  function toggleFavourite() {
    if (favouriteId) {
      removeStoryFromFavouite(favouriteId);
    } else {
      story && addStoryToFavourite(story?.id);
    }
  }

  function handleNavigateStoryNode() {}

  useEffect(() => {
    fetchStoryNode();
    fetchStory();
  }, []);

  useEffect(() => {
    setFavouriteId(story?.favourite ? story.favourite.id : "");
  }, [story]);

  return (
    <div className="flex flex-col gap-5">
      {/* Header - Story title  */}
      <div className="flex flex-row flex-wrap justify-around gap-2">
        <div>
          <h3 className="font-bold">
            [{capitalizeWords(story?.type ?? "")}] {story?.title}
          </h3>
          <div className="flex flex-row flex-wrap gap-1">
            {storyNodeParams.map((node, i) => (
              <h4 key={i}>
                {capitalizeWords(node.type)} {node.order_index} {i < storyNodeParams.length - 1 && "➤"}
              </h4>
            ))}
            <h4>:{storyNode?.title} Tiêu đề</h4>
          </div>

          <div>
            <span className="italic font-bold">Lượt xem:</span> {storyNode?.view}
          </div>
        </div>
        <div className="flex flex-row gap-3 justify-center items-center">
          <ArrowLeftIcon className="w-6 h-6 cursor-pointer"></ArrowLeftIcon>
          <h3 className=" cursor-pointer" onClick={() => setOpenStoryNodeList(!openStoryNodeList)}>
            {capitalizeWords(storyNode?.type ?? "")} {storyNode?.order_index}
          </h3>
          <ArrowRightIcon className="w-6 h-6 cursor-pointer"></ArrowRightIcon>
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
                className="bg-background shadow-2xs"
                onClickItem={handleNavigateStoryNode}
                storyNodes={story?.children}
                size={story?.number_of_chidren}
              ></StoryNodeList>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Button favourite, download */}
      <div className="flex flex-row flex-wrap justify-center items-center gap-5">
        <button
          onClick={toggleFavourite}
          className={`w-32 py-1.5 font-semibold border-2 border-foreground text-center rounded-sm ${favouriteId && "bg-red-400 text-white"}`}
        >
          {favouriteId ? "Đã yêu thích" : "Yêu thích"}
        </button>
        <Button>Tải về</Button>
      </div>

      {/* Main content */}
      <div>
        {/* Main header */}
        <div className="flex flex-row flex-wrap gap-5  justify-center">
          <FontSelection onChange={(fontId) => app?.updateReadingFont(fontId)} defaultValue={app?.readingFont}></FontSelection>
          <div className="flex flex-row gap-2 justify-center items-center w-fit">
            <p>Khoảng cách dòng</p>
            <NumberInput defaultValue={app?.readingLineSpacing} onChange={(value) => app?.updateReadingLineSpacing(value)}></NumberInput>
          </div>
          <div className="flex flex-row gap-2 justify-center items-center w-fit">
            <p>Cỡ chữ</p>
            <NumberInput defaultValue={app?.readingTextSize} onChange={(value) => app?.updateReadingTextSize(value)}></NumberInput>
          </div>
        </div>

        {/* Content */}
        <div
          style={{
            fontSize: app?.readingTextSize + "px",
            fontFamily: capitalizeWords(app?.readingFont ?? ""),
          }}
          className="w-full"
        >
          {content?.map((con, i) => (
            <div key={i} className="w-full">
              {con.type === "image" && (
                <div className="w-full">
                  <img className="w-full" src={con.image_url}></img>
                  <img className="object-cover rounded-[5]" src={process.env.NEXT_PUBLIC_API_URL + "uploads/story/" + con.image_url} alt="Cover Art"></img>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
