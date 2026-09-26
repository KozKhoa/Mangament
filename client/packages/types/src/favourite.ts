import Story from "./story";

export default interface Favourite {
  id: string;
  user_id: string;
  story: Story;
  created_at?: string;
}
