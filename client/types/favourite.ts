import Story from "./story";
import User from "./user";

export default interface Favourite {
  id: string;
  user_id: string;
  story: Story;
  created_at?: string;
}
