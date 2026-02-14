import Image from "./image";

export default interface StoryNode {
  id: string;
  story_id: string;
  parent?: StoryNode;
  title?: string;
  type: string;
  order_index: number;
  view?: number;
  number_of_children?: number;
  created_at?: Date;
  updated_at?: Date;
  content?: { type: string; image?: Image; content?: string }[];

  children?: StoryNode[];
}
