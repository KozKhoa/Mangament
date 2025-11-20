export default interface Params {
  id?: string;
  page?: number;
  limit?: number;
  type?: string;
  author?: string[];
  star?: string[];
  view?: string[];
  genre?: string[];
  sort?: string;
  isGettingChildren?: boolean;
  isGettingContent?: boolean;
  isGettingNewestChapter?: boolean;
}
