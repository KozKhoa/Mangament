import Story from "./story";
import StoryNode, { StoryNodeContent } from "./story-node";

export default interface History {
  id: string;
  user_id: string;
  story: Story;
  story_node: StoryNode;
  content?: StoryNodeContent;
  content_id?: string;
  created_at?: Date;
  updated_at?: Date;
}
