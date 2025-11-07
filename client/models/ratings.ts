export default interface Rating {
  userId: string;
  storyId: string;
  message: string;
  star: number;
  createAt?: Date;
  updateAt?: Date;
}
