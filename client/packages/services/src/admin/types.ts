import { Pagination } from "@/types/pagination";

export type ServiceResult<T> = {
  success: boolean;
  data?: T;
  message?: string;
  pagination?: Pagination;
};

export interface GetStatsViewParams {
  from: Date;
  to: Date;
  storyId?: string;
  groupBy?: string;
}

export interface GetStatsNewUsersParams {
  from: Date;
  to: Date;
  groupBy?: string;
}

export interface GetUsersParams {
  page?: number;
  limit?: number;
  search?: string;
  joinDate?: { from?: Date; to?: Date };
  genders?: string[];
  roles?: string[];
  isBanned?: boolean;
  sort?: string;
}

export interface UpdateUserParams {
  userId: string;
  name?: string;
  role?: string;
}

export interface BanUserParams {
  userId: string;
  isBanned: boolean;
}

export interface ActiveStoryParams {
  storyId: string;
  isActived: boolean;
}

export interface PaginationParams {
  page?: number;
  limit?: number;
}

export interface StoryTrashNodeParams {
  storyId?: string;
  parentId?: string;
  page?: number;
  limit?: number;
}
