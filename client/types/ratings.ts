import User from "./user";

export default interface Rating {
  story_id: string;
  message: string;
  star: number;
  created_at?: Date;
  updated_at?: Date;

  user?: User;
}
