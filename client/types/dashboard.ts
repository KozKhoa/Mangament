export interface DashboardOverview {
  totalUsers: number;
  totalBannedUsers: number;
  totalStories: number;
  totalView: number;
  totalRating: number;
  totalStoriesBaseOnStatus: { [key: string]: string };
  totalUserBaseOnRole: { [key: string]: string };
}

export interface DashboardStatsView {
  date: Date;
  view: number;
}

export interface DashboardStatsNewUsers {
  date: Date;
  count: number;
}
