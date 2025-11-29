export default interface StoryNode {
  id: string;
  story_id: string;
  parent_id?: string;
  title?: string;
  type: string;
  order_index: number;
  view?: number;
  number_of_children?: number;
  created_at?: Date;
  updated_at?: Date;
  content?: { [key: string]: any }[];

  children?: StoryNode[];
}
