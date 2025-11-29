export interface StoryParams {
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
  isGettingSummary?: boolean;
}

export interface StoryNodeParams {
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
