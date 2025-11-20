"use client";

import StoryCardAllInfo from "@/components/cards/stories/story-card-all-info";
import StoryNodeList from "@/components/list/story-node-list";
import storyService from "@/services/story";
import favouriteService from "@/services/user/favourite";
import { StoryParams } from "@/types/params";
import Story from "@/types/story";
import { Params } from "next/dist/server/request/params";
import { useParams } from "next/navigation";
import { useEffect, useState } from "react";
import { toast } from "sonner";

function getParams(params: Params) {
  const rawType = params?.type;
  const type = Array.isArray(rawType) ? rawType[0] : rawType ?? "";

  const rawId = params?.id;
  const id = Array.isArray(rawId) ? rawId[0] : rawId ?? "";

  return { type, id };
}

async function addStoryToFavourite(storyId: string) {
  const res = await favouriteService.post({ storyId: storyId });
  if (!res) return toast.warning("Server Error");
  if (!res.success) return toast.warning(res.message);

  toast.message("Add successfully");
}

async function removeStoryFromFavouite(favouriteId: string) {
  const res = await favouriteService.remove(favouriteId);

  if (!res) return toast.warning("Server Error");
  if (!res.success) return toast.warning(res.message);

  toast.message("Remove successfully");
}

export default function StoryDetail() {
  const params = useParams();
  const { type, id } = getParams(params);

  const [story, setStory] = useState<Story>();
  const [isInFavourite, setIsInFavourite] = useState<boolean>(story?.favourite ? true : false);

  async function fetchStory() {
    const storyParams: StoryParams = { id: id, isGettingChildren: true, isGettingSummary: true, type: type };

    const res = await storyService.get(storyParams);

    if (!res) toast.warning("Server Error");
    if (!res.success) toast.warning(res.message);

    setStory(res.data);
  }

  function toggleFavourite() {
    if (isInFavourite) {
      setIsInFavourite(false);
      story?.favourite?.id && removeStoryFromFavouite(story?.favourite.id);
    } else {
      setIsInFavourite(true);
      story && addStoryToFavourite(story?.id);
    }
  }

  function genReview(numberOfReview: number = 4) {
    let result: React.ReactNode | string;
    story?.children.map((child, i) => {
      if (child.type === "chapter") {
        const content = child.content;
        console.log(content);
      }
    });

    return result;
  }

  useEffect(() => {
    setIsInFavourite(story?.favourite ? true : false);
    console.log(story);
  }, [story]);

  useEffect(() => {
    fetchStory();
  }, []);

  return (
    <div className="w-full flex flex-col gap-10 font-afacad">
      <div className="flex flex-col lg:flex-row gap-5">
        {/* Story info */}
        <div className="lg:flex-1 flex flex-col gap-3">
          <StoryCardAllInfo story={story}></StoryCardAllInfo>

          {/* Button */}
          <div className="grid grid-cols-2 md:grid-cols-4 justify-center items-center gap-2">
            <button className="w-full py-1.5 font-semibold border-2 border-foreground text-center rounded-sm bg-foreground text-background ">Đọc từ đầu</button>
            <button className="w-full py-1.5 font-semibold border-2 border-foreground text-center rounded-sm bg-foreground text-background ">
              Đọc từ cuối
            </button>
            <button className="w-full py-1.5 font-semibold border-2 border-foreground text-center rounded-sm bg-foreground text-background ">Đọc tiếp</button>
            <button
              onClick={toggleFavourite}
              className={`w-full py-1.5 font-semibold border-2 border-foreground text-center rounded-sm ${isInFavourite && "bg-red-400 text-white"}`}
            >
              {isInFavourite ? "Đã yêu thích" : "Yêu thích"}
            </button>
          </div>
        </div>

        {/* Chapter list */}
        <StoryNodeList className="lg:flex-1" storyNodes={story?.children} size={story?.number_of_chidren}></StoryNodeList>
      </div>

      {/* Review */}
      <div>
        <h2>Xem trước</h2>
        <div>{genReview(5)}</div>
      </div>
    </div>
  );
}
