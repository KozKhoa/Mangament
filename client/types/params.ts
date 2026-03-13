export interface StoryParams {
  id?: string;
  title?: string;
  page?: number;
  limit?: number;
  type?: string[];
  keyword?: string;
  author?: string[];
  star?: string[];
  view?: string[];
  genre?: string[];
  status?: string[];
  nation?: string[];
  sort?: string;
  isGettingChildren?: boolean;
  isGettingContent?: boolean;
  isGettingNewestChapter?: boolean;
  isGettingSummary?: boolean;
}

export interface StoryNodeParams {
  id?: string;
  type?: string;
  isGettingChildren?: boolean;
  isGettingContent?: boolean;
}

export interface RatingParams {
  page?: number;
  limit?: number;

  sort?: string;
  star?: string;
}

export interface CommentParams {
  page?: number;
  limit?: number;

  sort?: string;
}

export interface HistoryParams {
  page?: number;
  limit?: number;
  sort?: string;

  fromDate?: Date;
  toDate?: Date;
}

export interface FavoureiteParams {
  page?: number;
  limit?: number;

  type?: string;
  author?: string[];
  star?: string[];
  view?: string[];
  genre?: string[];

  sort?: string;
}

export type Params = StoryParams | StoryNodeParams | RatingParams | CommentParams | HistoryParams | FavoureiteParams;
