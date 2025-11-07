import Image from "./image";

export default interface Story {
  id: string;
  title: string;
  nation?: string;
  view?: number;
  star?: number;
  type: string;
  status: string;
  nextChapterIn?: Date;
  numberOfChidren?: number;
  author?: string[];
  genre?: string[];
  coverArt?: Image;
  createAt?: Date;
  updateAt?: Date;
}
