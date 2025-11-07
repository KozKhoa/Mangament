export default interface StoryNode {
  id: string;
  title?: string;
  type: string;
  orderIndex: number;
  view?: string;
  numberOfChildren?: number;
  createAt?: Date;
  updateAt?: Date;
  content?: JSON;
}
