export default interface StoryNode {
  id: string;
  storyId: string;
  parentId?: string;
  title?: string;
  type: string;
  orderIndex: number;
  view?: string;
  numberOfChildren?: number;
  createAt: Date;
  updateAt?: Date;
  content?: JSON;

  children?: StoryNode[];
}
