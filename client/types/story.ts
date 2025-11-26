import Author from "./author";
import Image from "./image";
import Rating from "./ratings";
import StoryNode from "./story-node";

export default interface Story {
  id: string;
  title: string;
  nation?: string;
  view?: number;
  star?: number;
  type: string;
  status: string;
  next_chapter_in?: Date;
  number_of_chidren?: number;
  author?: Author[];
  genre?: string[];
  cover_art?: Image;
  created_at?: Date;
  updated_at?: Date;
  summary?: string;
  review?: string;

  favourite?: {
    id: string;
    user_id: string;
  };
  rating?: Rating;

  newest_chapter?: StoryNode[];

  children: StoryNode[];
}
