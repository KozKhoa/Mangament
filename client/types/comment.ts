import User from "./user";

export default interface Comment {
  id: string;
  story_id: string;
  story_node_id?: string;
  user_id: string;
  message: string;
  created_at?: Date;
  updated_at?: Date;

  user?: User;
}
