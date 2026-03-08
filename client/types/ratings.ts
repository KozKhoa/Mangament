import User from "./user";

export default interface Rating {
  id?: string;
  story_id?: string;
  title: string;
  content: string;
  star: number;
  created_at?: Date;
  updated_at?: Date;

  user?: User;
}
