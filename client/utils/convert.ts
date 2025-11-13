import qs from "qs";

import StoryNode from "@/models/story-node";

import { capitalizeFirstChar } from "./string";
import { diffDate } from "./date";

import NewestChapter from "@/models/newest-chapter";

// This func is used to convert newest chpater in StoryNode[] type to NewsetChapter[]
export function convertNewestChapter(newestChapter: StoryNode[]) {
  const result: NewestChapter[] = [];

  const getNewestChapter = (storyNode: StoryNode, parent: string) => {
    if (!storyNode) return "";
    const node =
      capitalizeFirstChar(storyNode.type) + " " + storyNode.orderIndex;
    if (storyNode.type === "chapter") {
      result?.push({
        id: storyNode.id,
        dir: parent + " " + node,
        dayPass: diffDate(
          new Date(),
          newestChapter.at(0)?.createAt || new Date()
        ),
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
