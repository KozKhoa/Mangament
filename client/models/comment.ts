export default interface Comment {
  id: string;
  storyId: string;
  storyNodeId?: string;
  userId: string;
  message: string;
  createAt?: Date;
  updateAt?: Date;
}
