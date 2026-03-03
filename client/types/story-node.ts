import Image from "./image";
import User from "./user";

export default interface StoryNode {
  id: string;
  story_id: string;

  parent_id?: string;
  parent?: StoryNode;

  title?: string;
  type: string;
  order_index: number;
  view?: number;
  number_of_children?: number;
  poster_id?: string;
  poster?: User;
  created_at?: Date;
  updated_at?: Date;

  is_deleted?: boolean;
  is_edited?: boolean;
  is_new?: boolean;

  content?: StoryNodeContent[];

  children?: StoryNode[];
}

export interface StoryNodeContent {
  type: string;
  order_index: Number;
  image?: Image;
  content?: string;

  story_node_id?: string;

  id: string;
  isDeleted?: boolean;
  isNew?: boolean;
  isEdited?: boolean;
  imageFile?: File;
}
