import db, { Role, StoryStatus } from "../configs/db.js";
import { redis } from "../configs/redis.js";

const REDIS_CACHE_DASHBOARD_OVERVIEW_KEY = "admin:dashboard:overview";
const REDIS_CACHE_DASHBOARD_OVERVIEW_TTL = 60;

const REDIS_CACHE_DASHBOARD_VIEW_KEY = "admin:dashboard:stats:views";
const REDIS_CACHE_DASHBOARD_VIEW_TTL = 60;

export async function GetDashboardOverview() {
  const cached = await redis.get(REDIS_CACHE_DASHBOARD_OVERVIEW_KEY);

  if (cached) {
    return { success: true, data: JSON.parse(cached) };
  } else {
    const totalUsers = (await db.user.count({ where: { is_deleted: false } })) ?? 0;
    const totalBannedUsers = (await db.user.count({ where: { is_banned: true, is_deleted: false } })) ?? 0;
    const totalStories = (await db.story.count({ where: { is_deleted: false } })) ?? 0;
    const totalView = (await db.story.aggregate({ _sum: { view: true } }))._sum.view ?? 0;

    const storyStatus = Object.values(StoryStatus);
    const totalStoriesBaseOnStatus = [];
    for (const status of storyStatus) {
      totalStoriesBaseOnStatus.push({ [status]: (await db.story.count({ where: { is_deleted: false, status: status } })) ?? 0 });
    }

    const userRoles = Object.values(Role);
    const totalUserBaseOnRole = [];
    for (const role of userRoles) {
      totalUserBaseOnRole.push({ [role]: (await db.user.count({ where: { is_deleted: false, role: role } })) ?? 0 });
    }

    const data = {
      totalStories,
      totalStoriesBaseOnStatus,
      totalUsers,
      totalUserBaseOnRole,
      totalBannedUsers,
      totalView,
    };

    await redis.setex(REDIS_CACHE_DASHBOARD_OVERVIEW_KEY, REDIS_CACHE_DASHBOARD_OVERVIEW_TTL, JSON.stringify(data));

    return { success: true, data: data };
  }
}

export async function GetDashboardViewByDate({ storyId, storyNodeId, fromDate, toDate }) {
  const cached = await redis.get(REDIS_CACHE_DASHBOARD_VIEW_KEY + fromDate + toDate);
  if (cached) {
    return { success: true, data: await JSON.parse(cached) };
  } else {
    const endDate = toDate ? new Date(toDate) : new Date();
    const startDate = fromDate ? new Date(fromDate) : new Date(endDate);

    const viewByDate = [];

    for (const date = new Date(startDate); date <= endDate; date.setDate(date.getDate() + 1)) {
      const prevDate = new Date(date);
      prevDate.setDate(prevDate.getDate() - 1);

      const count = await db.readingHistory.count({
        where: {
          ...(storyId && { story_id: storyId }),
          ...(storyNodeId && { story_node_id: storyNodeId }),
          updated_at: {
            gte: prevDate,
            lte: date,
          },
        },
        orderBy: { updated_at: "desc" },
      });

      viewByDate.push({ date: new Date(date), view: count });
    }

    await redis.setex(REDIS_CACHE_DASHBOARD_VIEW_KEY + fromDate + toDate, REDIS_CACHE_DASHBOARD_VIEW_TTL, JSON.stringify(viewByDate));

    return { success: true, data: viewByDate };
  }
}
