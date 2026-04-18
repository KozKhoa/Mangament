import Image from "./image";
import Story from "./story";
import User from "./user";

export default interface StoryNode {
  story?: Story;
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

  deleted_status?: "not_deleted" | "soft_deleted" | "soft_deleted_by_parent" | "pending_permanent_deletion";
  is_edited?: boolean;
  is_new?: boolean;
  is_deleted_before?: boolean;
  is_deleted_permantly?: boolean;

  content?: StoryNodeContent[];

  children?: StoryNode[];
}

export interface StoryNodeContent {
  id: string;
  type: string;
  order_index: Number;
  image?: Image;
  content?: string;

  story_node_id?: string;

  deleted_status?: "not_deleted" | "soft_deleted" | "soft_deleted_by_parent" | "pending_permanent_deletion";
  is_deleted_before?: boolean;
  is_deleted_permantly?: boolean;

  isNew?: boolean;
  isEdited?: boolean;
  imageFile?: File;
}
