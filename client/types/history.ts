import Story from "./story";
import StoryNode from "./story-node";

export default interface History {
  id: string;
  user_id: string;
  story: Story;
  story_node: StoryNode;
  created_at?: Date;
  updated_at?: Date;
}
