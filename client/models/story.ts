import Image from "./image";
import StoryNode from "./story-node";

export default interface Story {
  id: string;
  title: string;
  nation?: string;
  view?: number;
  star?: number;
  type: string;
  status: string;
  nextChapterIn?: Date;
  numberOfChidren?: number;
  author?: string[];
  genre?: string[];
  coverArt?: Image;
  createAt?: Date;
  updateAt?: Date;
  summary?: string;

  newestChapter?: StoryNode[];
}
