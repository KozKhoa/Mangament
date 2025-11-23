import User from "./user";

export default interface Rating {
  user_id: string;
  story_id: string;
  message: string;
  star: number;
  created_at?: Date;
  updated_at?: Date;

  user?: User;
}
