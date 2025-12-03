import qs from "qs";

import StoryNode from "@/types/story-node";

import { capitalizeFirstChar } from "./string";
import { diffDate } from "./date";

import NewestChapter from "@/types/newest-chapter";

// This func is used to convert newest chpater in StoryNode[] type to NewsetChapter[]
export function convertNewestChapter(newestChapter: StoryNode[]) {
  const result: NewestChapter[] = [];

  const getNewestChapter = (storyNode: StoryNode, parent: string) => {
    if (!storyNode) return "";
    const node = capitalizeFirstChar(storyNode.type) + " " + storyNode.order_index;
    if (storyNode.type === "chapter") {
      result?.push({
        id: storyNode.id,
        dir: parent + " " + node,
        dayPass: diffDate(new Date(), new Date(storyNode?.created_at ?? "")),
      });

      return;
    }
    if (storyNode.children) {
      for (const child of storyNode.children) {
        getNewestChapter(child, parent + node + "/");
      }
    }
  };
  for (const node of newestChapter) {
    getNewestChapter(node, "");
  }

  return result;
}

export function convertJsonToParam(json: {}) {
  return qs.stringify(json, { arrayFormat: "comma" });
}

export function convertDateTo_yyyMMdd(date: Date | null) {
  if (!date) date = new Date();
  return date.toISOString().split("T")[0];
}

export function convertDateTo_yyyMMddHHmm(date: Date | null) {
  if (!date) date = new Date();
  const isoString = date.toISOString();
  return isoString.substring(0, 16).replace("T", " ");
}
